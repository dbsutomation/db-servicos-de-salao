import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, startOfWeek, format, isSameDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentSalonId } from '@/lib/salon';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ApptStatus = 'pending' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
type Appt = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: ApptStatus;
  client_id: string;
  professional_id: string;
  started_at: string | null;
  client_name?: string;
  client_phone?: string;
  professional_name?: string;
  services?: { id: string; service_id: string; service_name: string; duration_minutes: number; price: number }[];
};
type Prof = { id: string; name: string };

const HOUR_START = 7;
const HOUR_END = 21;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
const PX_PER_MIN = 1; // 60px per hour
const DAY_COLS = 7;

const statusStyles: Record<string, string> = {
  pending: 'bg-[#FFF7ED] text-orange-900 border-l-4 border-l-[#F97316] border border-orange-200',
  scheduled: 'bg-primary text-primary-foreground border-primary',
  confirmed: 'bg-[#F0FDF4] text-green-900 border-l-4 border-l-[#22C55E] border border-green-200',
  in_progress: 'bg-amber-500 text-white border-amber-600',
  completed: 'bg-emerald-500/60 text-white border-emerald-600',
};

const statusLabel: Record<ApptStatus, string> = {
  pending: 'Pendente',
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  in_progress: 'Em atendimento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export default function Agenda() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isManager = !!currentUser?.isManager;

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [professionals, setProfessionals] = useState<Prof[]>([]);
  const [profFilter, setProfFilter] = useState<string>('all'); // 'all' | profId
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Appt | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [acting, setActing] = useState(false);

  const weekDays = useMemo(
    () => Array.from({ length: DAY_COLS }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Carregar profissionais (para filtro do manager)
  useEffect(() => {
    if (!isManager) return;
    (async () => {
      try {
        const salonId = await getCurrentSalonId();
        const { data } = await supabase
          .from('users')
          .select('id, name')
          .eq('salon_id', salonId);
        setProfessionals((data as any[]) ?? []);
      } catch (e) { /* ignore */ }
    })();
  }, [isManager]);

  // Carregar agendamentos da semana
  const fetchAppointments = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const salonId = await getCurrentSalonId();
      const from = weekStart.toISOString();
      const to = addDays(weekStart, DAY_COLS).toISOString();

      let q = supabase
        .from('appointments')
        .select('id, starts_at, ends_at, status, client_id, professional_id, started_at')
        .eq('salon_id', salonId)
        .neq('status', 'cancelled')
        .gte('starts_at', from)
        .lt('starts_at', to);

      if (!isManager) {
        q = q.eq('professional_id', currentUser.id);
      } else if (profFilter !== 'all') {
        q = q.eq('professional_id', profFilter);
      }

      const { data: appts, error } = await q;
      if (error) throw error;
      const list = (appts as any[]) ?? [];

      // Buscar nomes de clientes e profissionais
      const clientIds = Array.from(new Set(list.map(a => a.client_id)));
      const profIds = Array.from(new Set(list.map(a => a.professional_id)));
      const apptIds = list.map(a => a.id);

      const [clientsRes, profsRes, svcsRes] = await Promise.all([
        clientIds.length ? supabase.from('clients').select('id, name, phone').in('id', clientIds) : Promise.resolve({ data: [] as any[] } as any),
        profIds.length ? supabase.from('users').select('id, name').in('id', profIds) : Promise.resolve({ data: [] as any[] } as any),
        apptIds.length ? supabase.from('appointment_services').select('id, appointment_id, service_id, service_name, duration_minutes, price').in('appointment_id', apptIds) : Promise.resolve({ data: [] as any[] } as any),
      ]);

      const clientMap = new Map(((clientsRes.data as any[]) ?? []).map(c => [c.id, c]));
      const profMap = new Map(((profsRes.data as any[]) ?? []).map(p => [p.id, p.name]));
      const svcByAppt = new Map<string, any[]>();
      ((svcsRes.data as any[]) ?? []).forEach(s => {
        const arr = svcByAppt.get(s.appointment_id) ?? [];
        arr.push(s);
        svcByAppt.set(s.appointment_id, arr);
      });

      setAppointments(list.map(a => {
        const c = clientMap.get(a.client_id) as any;
        return {
          ...a,
          client_name: c?.name ?? 'Cliente',
          client_phone: c?.phone ?? '',
          professional_name: profMap.get(a.professional_id) ?? '',
          services: svcByAppt.get(a.id) ?? [],
        };
      }));
    } catch (e: any) {
      toast({ title: 'Erro ao carregar agenda', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, profFilter, isManager, currentUser?.id]);

  // Realtime: novas/atualizações de agendamentos atualizam a agenda em tempo real
  useEffect(() => {
    if (!currentUser?.id) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      try {
        const salonId = await getCurrentSalonId();
        channel = supabase
          .channel(`agenda-${currentUser.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'appointments', filter: `salon_id=eq.${salonId}` },
            () => { fetchAppointments(); }
          )
          .subscribe();
      } catch { /* ignore */ }
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, weekStart, profFilter, isManager]);

  const goPrevWeek = () => setWeekStart(d => addDays(d, -7));
  const goNextWeek = () => setWeekStart(d => addDays(d, 7));
  const goToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Render bloco
  const renderApptBlock = (appt: Appt) => {
    const start = new Date(appt.starts_at);
    const end = new Date(appt.ends_at);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();
    const top = (startMin - HOUR_START * 60) * PX_PER_MIN;
    const height = Math.max(24, (endMin - startMin) * PX_PER_MIN);
    const svcLabel = (appt.services ?? []).map(s => s.service_name).join(', ');
    return (
      <button
        key={appt.id}
        onClick={() => setSelected(appt)}
        className={cn(
          'absolute left-1 right-1 rounded-md border px-2 py-1 text-xs text-left shadow-sm hover:opacity-90 transition',
          statusStyles[appt.status] ?? statusStyles.scheduled
        )}
        style={{ top, height }}
      >
        {(appt.status === 'pending' || appt.status === 'confirmed') && (
          <div className="mb-1">
            <span className={cn(
              'inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold',
              appt.status === 'pending' ? 'bg-[#F97316] text-white' : 'bg-[#22C55E] text-white'
            )}>
              {statusLabel[appt.status]}
            </span>
          </div>
        )}
        <div className="font-medium truncate">{appt.client_name}</div>
        <div className="opacity-90 truncate">{svcLabel}</div>
        {appt.status === 'completed' && (
          <Badge variant="secondary" className="mt-1 h-4 text-[10px]">Concluído</Badge>
        )}
        {appt.status === 'in_progress' && (
          <Badge variant="secondary" className="mt-1 h-4 text-[10px]">Em atendimento</Badge>
        )}
      </button>
    );
  };

  const handleStart = async () => {
    if (!selected) return;
    setActing(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'in_progress', started_at: now })
        .eq('id', selected.id);
      if (error) throw error;

      // Persistir contexto do atendimento para o carrinho
      sessionStorage.setItem('activeAppointment', JSON.stringify({
        appointmentId: selected.id,
        clientId: selected.client_id,
        professionalId: selected.professional_id,
        serviceIds: (selected.services ?? []).map(s => s.service_id),
      }));

      setSelected(null);
      navigate('/cart');
    } catch (e: any) {
      toast({ title: 'Erro ao iniciar', description: e.message, variant: 'destructive' });
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    if (!selected) return;
    setActing(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: 'professional',
        })
        .eq('id', selected.id);
      if (error) throw error;
      toast({ title: 'Agendamento cancelado' });
      setCancelConfirmOpen(false);
      setSelected(null);
      fetchAppointments();
    } catch (e: any) {
      toast({ title: 'Erro ao cancelar', description: e.message, variant: 'destructive' });
    } finally {
      setActing(false);
    }
  };

  const totalSelected = (selected?.services ?? []).reduce((a, s) => a + Number(s.price ?? 0), 0);
  const headerLabel = `${format(weekStart, "dd MMM", { locale: ptBR })} – ${format(addDays(weekStart, 6), "dd MMM yyyy", { locale: ptBR })}`;

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Agenda</h1>
          <div className="flex items-center gap-2">
            {isManager && (
              <Select value={profFilter} onValueChange={setProfFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Profissional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os profissionais</SelectItem>
                  {professionals.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="icon" onClick={goPrevWeek}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={goToday}>Hoje</Button>
            <Button variant="outline" size="icon" onClick={goNextWeek}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground capitalize">{headerLabel}</div>

        <div className="border rounded-lg overflow-auto bg-white">
          {/* Header dias */}
          <div className="grid sticky top-0 z-10 bg-white border-b" style={{ gridTemplateColumns: '60px repeat(7, minmax(120px, 1fr))' }}>
            <div />
            {weekDays.map((d, i) => {
              const isToday = isSameDay(d, new Date());
              return (
                <div key={i} className={cn('px-2 py-2 text-center border-l', isToday && 'bg-primary/5')}>
                  <div className="text-xs uppercase text-muted-foreground">{format(d, 'EEE', { locale: ptBR })}</div>
                  <div className={cn('text-sm font-semibold', isToday && 'text-primary')}>{format(d, 'dd/MM')}</div>
                </div>
              );
            })}
          </div>

          {/* Grade */}
          <div className="grid relative" style={{ gridTemplateColumns: '60px repeat(7, minmax(120px, 1fr))' }}>
            {/* Coluna de horas */}
            <div className="relative" style={{ height: HOURS.length * 60 }}>
              {HOURS.map((h, i) => (
                <div key={h} className="absolute left-0 right-0 text-[11px] text-muted-foreground pr-1 text-right" style={{ top: i * 60 - 6 }}>
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
            {/* Colunas de dias */}
            {weekDays.map((d, idx) => {
              const dayAppts = appointments.filter(a => isSameDay(new Date(a.starts_at), d));
              return (
                <div key={idx} className="relative border-l" style={{ height: HOURS.length * 60 }}>
                  {/* linhas de hora */}
                  {HOURS.map((h, i) => (
                    <div key={h} className="absolute left-0 right-0 border-t border-dashed border-muted" style={{ top: i * 60 }} />
                  ))}
                  {dayAppts.map(renderApptBlock)}
                </div>
              );
            })}
          </div>
          {loading && <div className="p-4 text-sm text-center text-muted-foreground">Carregando…</div>}
          {!loading && appointments.length === 0 && (
            <div className="p-6 text-sm text-center text-muted-foreground">Nenhum agendamento nesta semana.</div>
          )}
        </div>
      </div>

      {/* Modal detalhes */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.client_name}</DialogTitle>
                <DialogDescription>Profissional: {selected.professional_name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-[120px_1fr] gap-1">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium">{format(new Date(selected.starts_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                  <span className="text-muted-foreground">Horário</span>
                  <span className="font-medium">
                    {format(new Date(selected.starts_at), 'HH:mm')} – {format(new Date(selected.ends_at), 'HH:mm')}
                  </span>
                  {selected.started_at && (
                    <>
                      <span className="text-muted-foreground">Iniciado</span>
                      <span className="font-medium">{format(new Date(selected.started_at), 'HH:mm')}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">{statusLabel[selected.status]}</span>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Serviços</div>
                  <ul className="space-y-1">
                    {(selected.services ?? []).map(s => (
                      <li key={s.id} className="flex justify-between border-b py-1">
                        <span>{s.service_name} <span className="text-muted-foreground">({s.duration_minutes}min)</span></span>
                        <span className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(s.price))}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-between font-semibold text-base pt-1">
                  <span>Total</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSelected)}</span>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                {(selected.status === 'scheduled' || selected.status === 'in_progress') && (
                  <Button variant="outline" className="text-destructive border-destructive" onClick={() => setCancelConfirmOpen(true)} disabled={acting}>
                    Cancelar agendamento
                  </Button>
                )}
                {selected.status === 'scheduled' && (
                  <Button onClick={handleStart} disabled={acting}>Iniciar atendimento</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação cancelamento */}
      <AlertDialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar este agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente não receberá notificação automática.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={acting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
