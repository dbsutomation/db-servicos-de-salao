import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient as supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { CalendarDays, Clock, User, Scissors, RefreshCw, X } from 'lucide-react';
import ClientLayout from '@/components/Layout/ClientLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Appointment = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  professional_name: string;
  services: { service_name: string; duration_minutes: number; price: number }[];
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Agendado',    color: 'bg-orange-100 text-orange-700 border-orange-200' },
  pending:   { label: 'Pendente',    color: 'bg-orange-100 text-orange-700 border-orange-200' },
  confirmed: { label: 'Confirmado',  color: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelado',   color: 'bg-red-100 text-red-700 border-red-200' },
  completed: { label: 'Concluído',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_progress: { label: 'Em atendimento', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

export default function MeusAgendamentos() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login-cliente'); return; }

      const { data: customer } = await supabase
        .from('customers')
        .select('client_id, salon_id')
        .eq('id', user.id)
        .maybeSingle();

      const cId = (customer as any)?.client_id;
      const sId = (customer as any)?.salon_id;
      if (!cId || !sId) { setLoading(false); return; }

      const { data: appts } = await supabase
        .from('appointments')
        .select('id, starts_at, ends_at, status, professional_id')
        .eq('client_id', cId)
        .eq('salon_id', sId)
        .order('starts_at', { ascending: false });

      if (!appts || appts.length === 0) { setLoading(false); return; }

      // Buscar nomes dos profissionais
      const profIds = [...new Set(appts.map((a: any) => a.professional_id))];
      const { data: profs } = await supabase
        .from('users')
        .select('id, name')
        .in('id', profIds);

      const profMap: Record<string, string> = {};
      ((profs as any[]) ?? []).forEach(p => { profMap[p.id] = p.name; });

      // Buscar serviços dos agendamentos
      const apptIds = appts.map((a: any) => a.id);
      const { data: svcRows } = await supabase
        .from('appointment_services')
        .select('appointment_id, service_name, duration_minutes, price')
        .in('appointment_id', apptIds);

      const svcMap: Record<string, any[]> = {};
      ((svcRows as any[]) ?? []).forEach(s => {
        if (!svcMap[s.appointment_id]) svcMap[s.appointment_id] = [];
        svcMap[s.appointment_id].push(s);
      });

      setAppointments(appts.map((a: any) => ({
        id: a.id,
        starts_at: a.starts_at,
        ends_at: a.ends_at,
        status: a.status,
        professional_name: profMap[a.professional_id] ?? 'Profissional',
        services: svcMap[a.id] ?? [],
      })));

      setLoading(false);
    };
    load();
  }, [navigate]);

  const canActOn = (appt: Appointment) =>
    isFuture(new Date(appt.starts_at)) &&
    !['confirmed', 'cancelled', 'completed', 'in_progress'].includes(appt.status);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setActing(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: 'client' })
        .eq('id', cancelTarget);
      if (error) throw error;
      setAppointments(prev =>
        prev.map(a => a.id === cancelTarget ? { ...a, status: 'cancelled' } : a)
      );
      toast({ title: 'Agendamento cancelado.' });
    } catch (e: any) {
      toast({ title: 'Erro ao cancelar', description: e.message, variant: 'destructive' });
    } finally {
      setActing(false);
      setCancelTarget(null);
    }
  };

  const handleReagendar = (appt: Appointment) => {
    // Volta para o fluxo de agendamento com uma mensagem de contexto
    navigate('/minha-agenda', { state: { reagendar: true, cancelId: appt.id } });
  };

  if (loading) return (
    <ClientLayout>
      <div className="p-8 text-center text-muted-foreground">Carregando seus agendamentos...</div>
    </ClientLayout>
  );

  return (
    <ClientLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Meus agendamentos</h1>
          <p className="text-sm text-muted-foreground">Acompanhe e gerencie seus horários</p>
        </div>

      {appointments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarDays className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p>Você ainda não tem agendamentos.</p>
            <Button className="mt-4" onClick={() => navigate('/minha-agenda')}>
              Fazer agendamento
            </Button>
          </CardContent>
        </Card>
      )}

      {appointments.map(appt => {
        const status = STATUS_LABEL[appt.status] ?? { label: appt.status, color: 'bg-gray-100 text-gray-700' };
        const podeAgir = canActOn(appt);
        const total = appt.services.reduce((s, sv) => s + sv.price, 0);

        return (
          <Card key={appt.id} className="overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">
                  {format(new Date(appt.starts_at), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(appt.starts_at), 'HH:mm')} &ndash; {format(new Date(appt.ends_at), 'HH:mm')}
                </CardDescription>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full border ${status.color}`}>
                {status.label}
              </span>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{appt.professional_name}</span>
              </div>

              {appt.services.length > 0 && (
                <div className="space-y-1">
                  {appt.services.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Scissors className="h-3 w-3" />
                        <span>{s.service_name}</span>
                        {s.duration_minutes > 0 && (
                          <span className="text-xs">({s.duration_minutes}min)</span>
                        )}
                      </div>
                      <span className="font-medium">
                        R$ {s.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                  {appt.services.length > 1 && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Total</span>
                        <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {podeAgir && (
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setCancelTarget(appt.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleReagendar(appt)}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reagendar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Dialog de confirmação de cancelamento */}
      <AlertDialog open={!!cancelTarget} onOpenChange={o => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Seu horário será liberado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={acting}
              className="bg-red-600 hover:bg-red-700"
            >
              {acting ? 'Cancelando...' : 'Confirmar cancelamento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </ClientLayout>
  );
}
