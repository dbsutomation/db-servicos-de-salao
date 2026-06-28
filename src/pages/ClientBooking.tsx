import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format, addDays, startOfDay, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { CheckCircle2, Plus, Minus, Check } from 'lucide-react';
import ClientLayout from '@/components/Layout/ClientLayout';

type Professional = {
  id: string;
  name: string;
  phone: string | null;
  categories: string[] | null;
};
type Schedule = { day_of_week: number; start_time: string; end_time: string };
type Service = { id: string; name: string; duration: number | null; price: number; category: string | null };

const STEPS = ['Profissional', 'Data', 'Horário', 'Serviços'] as const;

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export default function ClientBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const reagendarState = (location.state as any);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const [salonId, setSalonId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [selectedProf, setSelectedProf] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [busySlots, setBusySlots] = useState<{ s: number; e: number }[]>([]);

  const [confirmed, setConfirmed] = useState<{
    starts: Date; ends: Date; services: Service[];
  } | null>(null);

  // 1) Carregar cliente + profissionais que têm horário ativo
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login-cliente'); return; }

        const { data: customer } = await supabase
          .from('customers')
          .select('salon_id, client_id, name')
          .eq('id', user.id)
          .maybeSingle();

        const sId = (customer as any)?.salon_id;
        const cId = (customer as any)?.client_id;
        if (!sId || !cId) {
          toast({ title: 'Conta sem salão/cliente associado', variant: 'destructive' });
          return;
        }
        setSalonId(sId);
        setClientId(cId);
        setCustomerName((customer as any)?.name ?? null);

        const { data: scheds } = await supabase
          .from('professional_schedules')
          .select('professional_id, day_of_week, start_time, end_time, is_active')
          .eq('salon_id', sId)
          .eq('is_active', true);

        const profIds = Array.from(new Set(((scheds as any[]) ?? []).map(s => s.professional_id)));
        if (profIds.length === 0) { setProfessionals([]); return; }

        const { data: profs } = await supabase
          .from('users')
          .select('id, name, phone, categories, is_manager, salon_id')
          .eq('salon_id', sId)
          .in('id', profIds);

        setProfessionals(((profs as any[]) ?? [])
          .map(p => ({ id: p.id, name: p.name, phone: p.phone, categories: p.categories })));
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // 2) Quando profissional muda, carrega seus horários e serviços compatíveis
  useEffect(() => {
    if (!selectedProf || !salonId) return;
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setSelectedServiceIds([]);
    (async () => {
      const { data: scheds } = await supabase
        .from('professional_schedules')
        .select('day_of_week, start_time, end_time')
        .eq('professional_id', selectedProf.id)
        .eq('is_active', true);
      setSchedules(((scheds as any[]) ?? []) as Schedule[]);

      const cats = selectedProf.categories ?? [];
      let q = supabase.from('services').select('id, name, duration, price, category').eq('salon_id', salonId);
      const { data: svcs } = await q;
      const list = ((svcs as any[]) ?? []) as Service[];
      const filtered = cats.length > 0
        ? list.filter(s => s.category && cats.includes(s.category))
        : list;
      setServices(filtered);
    })();
  }, [selectedProf, salonId]);

  // 3) Quando data muda, busca agendamentos existentes do profissional naquele dia
  useEffect(() => {
    if (!selectedProf || !selectedDate) { setBusySlots([]); return; }
    (async () => {
      const dayStart = startOfDay(selectedDate);
      const dayEnd = addDays(dayStart, 1);
      const { data } = await supabase
        .from('appointments')
        .select('starts_at, ends_at, status')
        .eq('professional_id', selectedProf.id)
        .eq('status', 'scheduled')
        .gte('starts_at', dayStart.toISOString())
        .lt('starts_at', dayEnd.toISOString());
      const busy = ((data as any[]) ?? []).map(a => {
        const s = new Date(a.starts_at);
        const e = new Date(a.ends_at);
        return {
          s: s.getHours() * 60 + s.getMinutes(),
          e: e.getHours() * 60 + e.getMinutes(),
        };
      });
      setBusySlots(busy);
      setSelectedSlot(null);
    })();
  }, [selectedProf, selectedDate]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(() => addDays(today, 30), [today]);
  const activeWeekdays = useMemo(() => new Set(schedules.map(s => s.day_of_week)), [schedules]);

  const isDayDisabled = (date: Date) => {
    const d = startOfDay(date);
    if (d <= today) return true;
    if (d > maxDate) return true;
    return !activeWeekdays.has(d.getDay());
  };

  const dailySchedule = useMemo(() => {
    if (!selectedDate) return null;
    return schedules.find(s => s.day_of_week === selectedDate.getDay()) ?? null;
  }, [selectedDate, schedules]);

  const availableSlots = useMemo(() => {
    if (!dailySchedule) return [] as string[];
    const startM = timeToMinutes(dailySchedule.start_time);
    const endM = timeToMinutes(dailySchedule.end_time);
    const slots: string[] = [];
    for (let m = startM; m + 30 <= endM; m += 30) {
      const overlap = busySlots.some(b => m < b.e && m + 30 > b.s);
      if (!overlap) slots.push(minutesToTime(m));
    }
    return slots;
  }, [dailySchedule, busySlots]);

  const selectedServices = useMemo(
    () => services.filter(s => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  );
  const totalDuration = selectedServices.reduce((acc, s) => acc + (s.duration ?? 0), 0);
  const totalPrice = selectedServices.reduce((acc, s) => acc + (s.price ?? 0), 0);

  const startMinutes = selectedSlot ? timeToMinutes(selectedSlot) : null;
  const endMinutes = startMinutes !== null ? startMinutes + totalDuration : null;
  const exceedsWindow =
    dailySchedule && endMinutes !== null
      ? endMinutes > timeToMinutes(dailySchedule.end_time)
      : false;

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    if (!selectedProf || !selectedDate || !selectedSlot || !salonId || !clientId) return;
    if (selectedServices.length === 0 || exceedsWindow) return;
    setConfirming(true);
    try {
      const starts = new Date(selectedDate);
      starts.setHours(Math.floor(timeToMinutes(selectedSlot) / 60), timeToMinutes(selectedSlot) % 60, 0, 0);
      const ends = addMinutes(starts, totalDuration);

      const { data: appt, error: apptErr } = await supabase
        .from('appointments')
        .insert({
          salon_id: salonId,
          professional_id: selectedProf.id,
          client_id: clientId,
          starts_at: starts.toISOString(),
          ends_at: ends.toISOString(),
          status: 'scheduled',
        })
        .select('id')
        .single();
      if (apptErr) throw apptErr;

      const rows = selectedServices.map(s => ({
        appointment_id: (appt as any).id,
        service_id: s.id,
        service_name: s.name,
        duration_minutes: s.duration ?? 0,
        price: s.price,
      }));
      const { error: svcErr } = await supabase.from('appointment_services').insert(rows);
      if (svcErr) throw svcErr;

      // Se é um reagendamento, cancela o agendamento anterior
      if (reagendarState?.reagendar && reagendarState?.cancelId) {
        await supabase
          .from('appointments')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: 'client' })
          .eq('id', reagendarState.cancelId);
      }

      setConfirmed({ starts, ends, services: selectedServices });
    } catch (e: any) {
      toast({ title: 'Erro ao agendar', description: e.message, variant: 'destructive' });
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return (
    <ClientLayout>
      <div className="p-8 text-center text-muted-foreground">Carregando\u2026</div>
    </ClientLayout>
  );

  if (confirmed && selectedProf) {
    return (
      <ClientLayout>
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <CardTitle>Agendamento confirmado!</CardTitle>
            <CardDescription>Resumo do seu agendamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Profissional</span>
              <span className="font-medium">{selectedProf.name}</span>
              <span className="text-muted-foreground">Data</span>
              <span className="font-medium">{format(confirmed.starts, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
              <span className="text-muted-foreground">Hor\u00e1rio</span>
              <span className="font-medium">
                {format(confirmed.starts, 'HH:mm')} \u2013 {format(confirmed.ends, 'HH:mm')}
              </span>
              <span className="text-muted-foreground">Servi\u00e7os</span>
              <span className="font-medium">{confirmed.services.map(s => s.name).join(', ')}</span>
            </div>
            <Button className="w-full" onClick={() => navigate('/meus-agendamentos')}>
              Ver meus agendamentos
            </Button>
            <Button variant="outline" className="w-full" onClick={() => {
              setConfirmed(null);
              setStep(1);
              setSelectedProf(null);
              setSelectedDate(undefined);
              setSelectedSlot(null);
              setSelectedServiceIds([]);
            }}>
              Fazer outro agendamento
            </Button>
          </CardContent>
        </Card>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
      {reagendarState?.reagendar && (
        <div className="bg-orange-50 border border-orange-200 rounded-md px-4 py-3 text-sm text-orange-700">
          Escolha um novo hor\u00e1rio. O agendamento anterior ser\u00e1 cancelado automaticamente ao confirmar.
        </div>
      )}

      {/* Stepper */}
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3 | 4;
          const active = n === step;
          const done = n < step;
          return (
            <li key={label} className="flex-1 flex items-center gap-2">
              <span className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border shrink-0',
                active && 'bg-primary text-primary-foreground border-primary',
                done && 'bg-primary/20 border-primary text-primary',
                !active && !done && 'bg-muted text-muted-foreground'
              )}>{n}</span>
              <span className={cn('text-sm hidden sm:inline', active ? 'font-medium' : 'text-muted-foreground')}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Escolha o profissional</CardTitle>
            <CardDescription>Selecione com quem deseja agendar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {professionals.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum profissional disponível.</p>
            )}
            {professionals.map(p => {
              const sel = selectedProf?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProf(p)}
                  className={cn(
                    'relative w-full flex items-center gap-3 p-3 rounded-md border text-left transition-colors',
                    sel ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'
                  )}
                >
                  {sel && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <Avatar>
                    <AvatarFallback>{initials(p.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{p.name}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(p.categories ?? []).map(c => (
                        <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
            <div className="flex justify-end">
              <Button disabled={!selectedProf} onClick={() => setStep(2)}>Avançar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Escolha a data</CardTitle>
            <CardDescription>Próximos 30 dias disponíveis para {selectedProf?.name}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeWeekdays.size === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este profissional ainda não configurou horários de trabalho.
              </p>
            ) : (
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={isDayDisabled}
                  fromDate={addDays(today, 1)}
                  toDate={maxDate}
                  locale={ptBR}
                  initialFocus
                  className={cn('p-3 pointer-events-auto border rounded-md')}
                />
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
              <Button disabled={!selectedDate} onClick={() => setStep(3)}>Avançar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Escolha o horário</CardTitle>
            <CardDescription>
              {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum horário disponível para esta data.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map(slot => (
                  <Button
                    key={slot}
                    variant={selectedSlot === slot ? 'default' : 'outline'}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
              <Button disabled={!selectedSlot} onClick={() => setStep(4)}>Avançar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="flex flex-col max-h-[calc(100vh-10rem)]">
          <CardHeader className="shrink-0">
            <CardTitle>Escolha os serviços</CardTitle>
            <CardDescription>
              Início às <strong>{selectedSlot}</strong> com {selectedProf?.name}.
            </CardDescription>
          </CardHeader>

          <div className="max-h-[calc(100vh-380px)] overflow-y-auto px-6 py-2">
            {services.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum serviço compatível com as especialidades deste profissional.
              </p>
            )}
            <div className="space-y-2 pb-4">
              {services.map(s => {
                const sel = selectedServiceIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-md border text-left transition-colors',
                      sel ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="min-w-0">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.duration ?? 0} min · R$ {Number(s.price).toFixed(2)}
                      </div>
                    </div>
                    {sel ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 border-t bg-background px-6 py-4 space-y-3 sticky bottom-0">
            <h3 className="text-sm font-semibold">Resumo do agendamento</h3>

            {selectedServices.length > 0 ? (
              <div className="space-y-2">
                {selectedServices.map(s => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {s.name} <span className="text-xs">({s.duration ?? 0} min)</span>
                    </span>
                    <span className="font-medium">R$ {Number(s.price).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Início</span>
                  <span className="font-medium">{selectedSlot ?? '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Término previsto</span>
                  <span className="font-medium">
                    {endMinutes !== null ? minutesToTime(endMinutes) : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor total</span>
                  <span className="font-medium">R$ {Number(totalPrice).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum serviço selecionado.</p>
            )}

            {exceedsWindow && (
              <p className="text-sm text-destructive">
                Tempo total excede o horário disponível. Remova um serviço ou escolha outro horário.
              </p>
            )}

            <div className="flex justify-between pt-1">
              <Button variant="ghost" onClick={() => setStep(3)}>Voltar</Button>
              <Button
                disabled={selectedServices.length === 0 || exceedsWindow || confirming}
                onClick={handleConfirm}
              >
                {confirming ? 'Confirmando…' : 'Confirmar agendamento'}
              </Button>
            </div>
          </div>
        </Card>
      )}
      </div>
    </ClientLayout>
  );
}
