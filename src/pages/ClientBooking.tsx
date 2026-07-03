import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabaseClient as supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format, addDays, startOfDay, isSameMonth, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { CheckCircle2, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import ClientLayout from '@/components/Layout/ClientLayout';

// ─── Tipos ───────────────────────────────────────────────────────────────────
type Professional = { id: string; name: string; phone: string | null; categories: string[] | null };
type Schedule     = { day_of_week: number; start_time: string; end_time: string };
type Service      = { id: string; name: string; duration: number; price: number; category: string | null; image?: string | null };

// Nova ordem: Profissional → Serviços → Data → Horário
const STEPS = ['Profissional', 'Serviços', 'Data', 'Horário'] as const;

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0,2).map(p => p[0]?.toUpperCase()).join('');

const timeToMinutes = (t: string) => { const [h,m] = t.split(':').map(Number); return h*60+m; };
const minutesToTime = (m: number) => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;

// ─── Componente ──────────────────────────────────────────────────────────────
export default function ClientBooking() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const reagendarState = (location.state as any);

  const [step, setStep] = useState<1|2|3|4>(1);
  const [loading, setLoading]     = useState(true);
  const [confirming, setConfirming] = useState(false);

  const [salonId, setSalonId]   = useState<string|null>(null);
  const [clientId, setClientId] = useState<string|null>(null);

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [allServices, setAllServices]     = useState<Service[]>([]);
  const [schedules, setSchedules]         = useState<Schedule[]>([]);
  const [busySlots, setBusySlots]         = useState<{s:number;e:number}[]>([]);

  const [selectedProf, setSelectedProf]           = useState<Professional|null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate]            = useState<Date|undefined>();
  const [selectedSlot, setSelectedSlot]            = useState<string|null>(null);
  const [calendarMonth, setCalendarMonth]          = useState<Date>(startOfDay(new Date()));

  const [confirmed, setConfirmed] = useState<{starts:Date;ends:Date;services:Service[]}|null>(null);

  // ── 1) Boot: cliente + profissionais ─────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login-cliente'); return; }

        const { data: customer } = await supabase
          .from('customers').select('salon_id, client_id')
          .eq('id', user.id).maybeSingle();

        const sId = (customer as any)?.salon_id;
        const cId = (customer as any)?.client_id;
        if (!sId || !cId) { toast({ title: 'Conta sem salão associado', variant: 'destructive' }); return; }
        setSalonId(sId); setClientId(cId);

        const { data: scheds } = await supabase
          .from('professional_schedules')
          .select('professional_id, day_of_week, start_time, end_time, is_active')
          .eq('salon_id', sId).eq('is_active', true);

        const profIds = Array.from(new Set(((scheds as any[])?? []).map(s => s.professional_id)));
        if (!profIds.length) { setProfessionals([]); return; }

        const { data: profs } = await supabase
          .from('users').select('id, name, phone, categories')
          .eq('salon_id', sId).in('id', profIds);

        setProfessionals(((profs as any[])?? []).map(p => ({
          id: p.id, name: p.name, phone: p.phone, categories: p.categories
        })));
      } finally { setLoading(false); }
    })();
  }, [navigate]);

  // ── 2) Quando profissional muda → carrega serviços e schedules ──────────
  useEffect(() => {
    if (!selectedProf || !salonId) return;
    setSelectedServiceIds([]); setSelectedDate(undefined); setSelectedSlot(null);
    (async () => {
      const cats = selectedProf.categories ?? [];
      const { data: svcs } = await supabase
        .from('services').select('id, name, duration, price, category, image')
        .eq('salon_id', salonId).order('name');
      const list = ((svcs as any[])?? []) as Service[];
      setAllServices(cats.length ? list.filter(s => s.category && cats.includes(s.category)) : list);

      const { data: sc } = await supabase
        .from('professional_schedules').select('day_of_week, start_time, end_time')
        .eq('professional_id', selectedProf.id).eq('is_active', true);
      setSchedules(((sc as any[])?? []) as Schedule[]);
    })();
  }, [selectedProf, salonId]);

  // ── 3) Quando data muda → busca slots ocupados via RPC ──────────────────
  useEffect(() => {
    if (!selectedProf || !selectedDate) { setBusySlots([]); return; }
    (async () => {
      const dateStr  = format(selectedDate, 'yyyy-MM-dd');
      const dayStart = new Date(`${dateStr}T00:00:00-03:00`).toISOString();
      const dayEnd   = new Date(`${dateStr}T23:59:59-03:00`).toISOString();
      const { data } = await supabase.rpc('get_busy_slots', {
        p_professional_id: selectedProf.id, p_date_start: dayStart, p_date_end: dayEnd,
      });
      const toMin = (d: Date) => { const br = new Date(d.getTime()-3*60*60*1000); return br.getUTCHours()*60+br.getUTCMinutes(); };
      setBusySlots(((data as any[])?? []).map(a => ({ s: toMin(new Date(a.starts_at)), e: toMin(new Date(a.ends_at)) })));
      setSelectedSlot(null);
    })();
  }, [selectedProf, selectedDate, step]);

  // ── Serviços selecionados e duração total ────────────────────────────────
  const selectedServices = useMemo(
    () => allServices.filter(s => selectedServiceIds.includes(s.id)),
    [allServices, selectedServiceIds]
  );
  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (s.duration ?? 0), 0),
    [selectedServices]
  );
  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.price, 0),
    [selectedServices]
  );

  // ── Calendário: dias disponíveis ─────────────────────────────────────────
  const today     = useMemo(() => startOfDay(new Date()), []);
  const limitDate = useMemo(() => addDays(today, 30), [today]);
  const maxDate   = useMemo(() => addDays(limitDate, 6), [limitDate]);
  const activeWeekdays = useMemo(() => new Set(schedules.map(s => s.day_of_week)), [schedules]);

  const isDayDisabled = (date: Date) => {
    const d = startOfDay(date);
    if (d < today) return true;
    if (d > limitDate) return true;
    return !activeWeekdays.has(d.getDay());
  };

  // ── Slots disponíveis (considera duração total dos serviços) ─────────────
  const dailySchedule = useMemo(() => {
    if (!selectedDate) return null;
    return schedules.find(s => s.day_of_week === selectedDate.getDay()) ?? null;
  }, [selectedDate, schedules]);

  const availableSlots = useMemo(() => {
    if (!dailySchedule || totalDuration === 0) return [] as string[];
    const startM = timeToMinutes(dailySchedule.start_time);
    const endM   = timeToMinutes(dailySchedule.end_time);
    const slots: string[] = [];
    for (let m = startM; m + totalDuration <= endM; m += 30) {
      slots.push(minutesToTime(m));
    }
    return slots;
  }, [dailySchedule, totalDuration]);

  const isSlotBusy = (slot: string) => {
    const m = timeToMinutes(slot);
    return busySlots.some(b => m < b.e && m + totalDuration > b.s);
  };

  const startMinutes = selectedSlot ? timeToMinutes(selectedSlot) : null;
  const endMinutes   = startMinutes !== null ? startMinutes + totalDuration : null;
  const exceedsWindow = dailySchedule && endMinutes !== null
    ? endMinutes > timeToMinutes(dailySchedule.end_time) : false;
  const hasConflict = useMemo(() => {
    if (startMinutes === null || endMinutes === null || totalDuration === 0) return false;
    return busySlots.some(b => startMinutes < b.e && endMinutes > b.s);
  }, [startMinutes, endMinutes, totalDuration, busySlots]);

  // ── Confirmar agendamento ────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!selectedProf || !selectedDate || !selectedSlot || !salonId || !clientId) return;
    setConfirming(true);
    try {
      const starts = new Date(selectedDate);
      const [h, m] = selectedSlot.split(':').map(Number);
      starts.setHours(h, m, 0, 0);
      const ends = new Date(starts.getTime() + totalDuration * 60000);

      const { data: appt, error } = await supabase
        .from('appointments')
        .insert({ salon_id: salonId, professional_id: selectedProf.id, client_id: clientId,
          starts_at: starts.toISOString(), ends_at: ends.toISOString(), status: 'scheduled' })
        .select('id').single();
      if (error) throw error;

      const rows = selectedServices.map(s => ({
        appointment_id: appt.id, service_id: s.id, service_name: s.name,
        duration_minutes: s.duration, price: s.price,
      }));
      const { error: svcErr } = await supabase.from('appointment_services').insert(rows);
      if (svcErr) throw svcErr;

      if (reagendarState?.reagendar && reagendarState?.cancelId) {
        await supabase.from('appointments')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: 'client' })
          .eq('id', reagendarState.cancelId);
      }

      setConfirmed({ starts, ends, services: selectedServices });
    } catch (e: any) {
      toast({ title: 'Erro ao confirmar', description: e.message, variant: 'destructive' });
    } finally { setConfirming(false); }
  };

  // ── Tela de confirmação ──────────────────────────────────────────────────
  if (confirmed && selectedProf) {
    return (
      <ClientLayout>
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle>Agendamento confirmado!</CardTitle>
            <CardDescription>Resumo do seu agendamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-[110px_1fr] gap-2 text-sm">
              <span className="text-muted-foreground">Profissional</span>
              <span className="font-medium">{selectedProf.name}</span>
              <span className="text-muted-foreground">Data</span>
              <span className="font-medium">{format(confirmed.starts, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
              <span className="text-muted-foreground">Horário</span>
              <span className="font-medium">{format(confirmed.starts,'HH:mm')} – {format(confirmed.ends,'HH:mm')}</span>
              <span className="text-muted-foreground">Serviços</span>
              <span className="font-medium">{confirmed.services.map(s=>s.name).join(', ')}</span>
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">R$ {totalPrice.toFixed(2).replace('.',',')}</span>
            </div>
            <Button className="w-full" onClick={() => navigate('/meus-agendamentos')}>
              Ver meus agendamentos
            </Button>
            <Button variant="outline" className="w-full" onClick={() => {
              setConfirmed(null); setStep(1); setSelectedProf(null);
              setSelectedDate(undefined); setSelectedSlot(null); setSelectedServiceIds([]);
            }}>
              Fazer outro agendamento
            </Button>
          </CardContent>
        </Card>
      </ClientLayout>
    );
  }

  if (loading) return (
    <ClientLayout>
      <div className="p-8 text-center text-muted-foreground">Carregando...</div>
    </ClientLayout>
  );

  // ── Stepper ──────────────────────────────────────────────────────────────
  return (
    <ClientLayout>
      <div className="space-y-6">
        {reagendarState?.reagendar && (
          <div className="bg-orange-50 border border-orange-200 rounded-md px-4 py-3 text-sm text-orange-700">
            Escolha um novo horário. O agendamento anterior será cancelado ao confirmar.
          </div>
        )}

        {/* Stepper */}
        <ol className="flex items-center justify-between gap-1">
          {STEPS.map((label, i) => {
            const n = (i+1) as 1|2|3|4;
            const active = n === step;
            const done   = n < step;
            return (
              <li key={label} className="flex-1 flex items-center gap-1">
                <span className={cn('flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0',
                  active ? 'bg-primary text-primary-foreground' :
                  done   ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                  {done ? '✓' : n}
                </span>
                <span className={cn('text-xs hidden sm:block', active ? 'font-semibold' : 'text-muted-foreground')}>{label}</span>
                {i < STEPS.length-1 && <span className="flex-1 h-px bg-muted ml-1" />}
              </li>
            );
          })}
        </ol>

        {/* ── STEP 1: Profissional ── */}
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
              {professionals.map(p => (
                <button key={p.id} onClick={() => setSelectedProf(p)}
                  className={cn('w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left',
                    selectedProf?.id === p.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}>
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {initials(p.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{p.name}</p>
                    {p.categories?.length ? (
                      <p className="text-xs text-muted-foreground truncate">{p.categories.join(' · ')}</p>
                    ) : null}
                  </div>
                  {selectedProf?.id === p.id && <span className="text-primary text-lg">✓</span>}
                </button>
              ))}
              <div className="flex justify-end pt-2">
                <Button disabled={!selectedProf} onClick={() => setStep(2)}>Avançar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 2: Serviços ── */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Escolha os serviços</CardTitle>
              <CardDescription>
                <span className="font-medium text-salon-purple">{selectedProf?.name}</span>
                {' · '}Selecione um ou mais serviços.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {allServices.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum serviço disponível.</p>
              )}
              <div className="divide-y border rounded-lg overflow-hidden">
                {allServices.map(s => {
                  const selected = selectedServiceIds.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => setSelectedServiceIds(prev =>
                      selected ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                      className={cn('w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                        selected ? 'bg-primary/5' : 'hover:bg-muted/50')}>
                      {s.image?.startsWith('https://') && (
                        <div className="w-10 h-10 rounded shrink-0 overflow-hidden bg-muted">
                          <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.duration}min</p>
                      </div>
                      <span className="text-sm font-semibold text-salon-purple shrink-0">
                        R$ {s.price.toFixed(2).replace('.',',')}
                      </span>
                      <span className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                        selected ? 'bg-primary border-primary text-white' : 'border-muted-foreground')}>
                        {selected && <span className="text-xs">✓</span>}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedServices.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  {selectedServices.map(s => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{s.name}</span>
                      <span>R$ {s.price.toFixed(2).replace('.',',')}</span>
                    </div>
                  ))}
                  <Separator className="my-1" />
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total · {totalDuration}min</span>
                    <span>R$ {totalPrice.toFixed(2).replace('.',',')}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
                <Button disabled={selectedServiceIds.length === 0} onClick={() => setStep(3)}>
                  Avançar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 3: Data ── */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Escolha a data</CardTitle>
              <CardDescription>
                <span className="font-medium text-salon-purple">{selectedProf?.name}</span>
                {' · '}{totalDuration}min de serviços · Próximos 30 dias.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeWeekdays.size === 0 ? (
                <p className="text-sm text-muted-foreground">Profissional sem horários cadastrados.</p>
              ) : (
                <div className="flex justify-center">
                  {(() => {
                    const monthStart  = startOfMonth(calendarMonth);
                    const monthEnd    = endOfMonth(calendarMonth);
                    const gridStart   = startOfWeek(monthStart, { weekStartsOn: 0 });
                    const gridEnd     = endOfWeek(monthEnd,   { weekStartsOn: 0 });
                    const days: Date[] = [];
                    for (let d = gridStart; d <= gridEnd; d = addDays(d,1)) days.push(new Date(d));
                    const weekDays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
                    const canGoPrev = startOfMonth(addDays(monthStart,-1)) >= startOfMonth(today);
                    const canGoNext = startOfMonth(addDays(monthEnd,1))   <= startOfMonth(limitDate);
                    return (
                      <div className="border rounded-md p-3 w-full max-w-xs">
                        <div className="flex items-center justify-between mb-3">
                          <button onClick={() => setCalendarMonth(startOfMonth(addDays(monthStart,-1)))}
                            disabled={!canGoPrev} className="p-1 rounded hover:bg-muted disabled:opacity-30">
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-medium capitalize">
                            {format(calendarMonth,'MMMM yyyy',{locale:ptBR})}
                          </span>
                          <button onClick={() => setCalendarMonth(startOfMonth(addDays(monthEnd,1)))}
                            disabled={!canGoNext} className="p-1 rounded hover:bg-muted disabled:opacity-30">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-7 mb-1">
                          {weekDays.map(w => (
                            <div key={w} className="text-center text-xs text-muted-foreground py-1">{w}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-1">
                          {days.map((day,i) => {
                            const disabled   = isDayDisabled(day);
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const isToday    = isSameDay(day, today);
                            const otherMonth = !isSameMonth(day, calendarMonth);
                            return (
                              <button key={i} onClick={() => !disabled && setSelectedDate(day)}
                                disabled={disabled}
                                className={cn('h-8 w-8 mx-auto rounded-full text-sm flex items-center justify-center transition-colors',
                                  isSelected && 'bg-primary text-primary-foreground font-semibold',
                                  !isSelected && !disabled && !otherMonth && 'hover:bg-accent',
                                  !isSelected && isToday && 'font-bold text-primary',
                                  disabled && 'text-muted-foreground opacity-30 cursor-not-allowed',
                                  otherMonth && !disabled && 'text-muted-foreground')}>
                                {format(day,'d')}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
                <Button disabled={!selectedDate} onClick={() => setStep(4)}>Avançar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 4: Horário ── */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Escolha o horário</CardTitle>
              <CardDescription>
                <span className="font-medium text-salon-purple">{selectedProf?.name}</span>
                {selectedDate && <>{' · '}{format(selectedDate,"EEEE, dd 'de' MMMM",{locale:ptBR})}</>}
                {' · '}{totalDuration}min
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum horário disponível para esta data com os serviços selecionados.</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map(slot => {
                      const busy = isSlotBusy(slot);
                      return (
                        <Button key={slot}
                          variant={selectedSlot === slot ? 'default' : 'outline'}
                          disabled={busy}
                          onClick={() => !busy && setSelectedSlot(slot)}
                          className={busy ? 'opacity-40 cursor-not-allowed line-through' : ''}>
                          {slot}
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">Horários riscados já estão ocupados.</p>
                </>
              )}

              {hasConflict && (
                <p className="text-sm text-destructive">
                  Este horário conflita com outro agendamento. Escolha outro horário.
                </p>
              )}

              {/* Resumo final */}
              {selectedSlot && !hasConflict && !exceedsWindow && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profissional</span>
                    <span className="font-medium">{selectedProf?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-medium">{selectedDate && format(selectedDate,"dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horário</span>
                    <span className="font-medium">
                      {selectedSlot} – {endMinutes !== null ? minutesToTime(endMinutes) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serviços</span>
                    <span className="font-medium text-right max-w-[180px] truncate">
                      {selectedServices.map(s=>s.name).join(', ')}
                    </span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>R$ {totalPrice.toFixed(2).replace('.',',')}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(3)}>Voltar</Button>
                <Button
                  disabled={!selectedSlot || hasConflict || exceedsWindow || confirming}
                  onClick={handleConfirm}>
                  {confirming ? 'Confirmando…' : 'Confirmar agendamento'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientLayout>
  );
}
