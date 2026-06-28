import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

type Professional = { id: string; name: string };

const STEPS = ['Serviço', 'Profissional', 'Data'] as const;

export default function ClientBooking() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);

  const [salonId, setSalonId] = useState<string | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  // Etapa 3 state
  const [activeWeekdays, setActiveWeekdays] = useState<Set<number>>(new Set());
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Carrega salon do customer logado e lista de profissionais
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login-cliente');
          return;
        }
        const { data: customer } = await supabase
          .from('customers' as any)
          .select('salon_id')
          .eq('id', user.id)
          .maybeSingle();
        const sId = (customer as any)?.salon_id;
        if (!sId) {
          toast({ title: 'Conta sem salão associado', variant: 'destructive' });
          return;
        }
        setSalonId(sId);

        const { data: profs } = await supabase
          .from('users')
          .select('id, name')
          .eq('salon_id', sId)
          .eq('is_manager', false);
        setProfessionals(((profs as any[]) ?? []).map(p => ({ id: p.id, name: p.name })));
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // Quando profissional é escolhido, buscar dias da semana que ele trabalha
  useEffect(() => {
    if (!selectedProfessional) return;
    setLoadingSchedule(true);
    setSelectedDate(undefined);
    (async () => {
      const { data, error } = await supabase
        .from('professional_schedules' as any)
        .select('day_of_week, is_active')
        .eq('professional_id', selectedProfessional.id);
      if (error) {
        toast({ title: 'Erro ao carregar horários', description: error.message, variant: 'destructive' });
        setActiveWeekdays(new Set());
      } else {
        const days = new Set<number>(
          ((data as any[]) ?? [])
            .filter(r => r.is_active)
            .map(r => Number(r.day_of_week))
        );
        setActiveWeekdays(days);
      }
      setLoadingSchedule(false);
    })();
  }, [selectedProfessional]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(() => addDays(today, 30), [today]);

  // Desabilita: passados, > 30 dias, ou dias da semana sem horário
  const isDayDisabled = (date: Date) => {
    const d = startOfDay(date);
    if (d < today) return true;
    if (d > maxDate) return true;
    return !activeWeekdays.has(d.getDay());
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando…</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 space-y-6">
      {/* Stepper */}
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const active = n === step;
          const done = n < step;
          return (
            <li key={label} className="flex-1 flex items-center gap-2">
              <span
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border',
                  active && 'bg-primary text-primary-foreground border-primary',
                  done && 'bg-primary/20 border-primary text-primary',
                  !active && !done && 'bg-muted text-muted-foreground'
                )}
              >
                {n}
              </span>
              <span className={cn('text-sm', active ? 'font-medium' : 'text-muted-foreground')}>
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
            <CardTitle>Etapa 1 — Escolher serviço</CardTitle>
            <CardDescription>Em breve.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button onClick={() => setStep(2)}>Avançar</Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 2 — Escolher profissional</CardTitle>
            <CardDescription>Selecione com quem deseja agendar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {professionals.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum profissional disponível.</p>
              )}
              {professionals.map(p => (
                <Button
                  key={p.id}
                  variant={selectedProfessional?.id === p.id ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setSelectedProfessional(p)}
                >
                  {p.name}
                </Button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
              <Button disabled={!selectedProfessional} onClick={() => setStep(3)}>Avançar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapa 3 — Escolher data</CardTitle>
            <CardDescription>
              {selectedProfessional
                ? `Próximos 30 dias disponíveis para ${selectedProfessional.name}.`
                : 'Escolha um profissional primeiro.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingSchedule ? (
              <p className="text-sm text-muted-foreground">Carregando horários…</p>
            ) : activeWeekdays.size === 0 ? (
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
                  fromDate={today}
                  toDate={maxDate}
                  locale={ptBR}
                  initialFocus
                  className={cn('p-3 pointer-events-auto border rounded-md')}
                />
              </div>
            )}

            {selectedDate && (
              <p className="text-sm text-center">
                Data selecionada:{' '}
                <strong>{format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</strong>
              </p>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
              <Button disabled={!selectedDate}>Avançar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
