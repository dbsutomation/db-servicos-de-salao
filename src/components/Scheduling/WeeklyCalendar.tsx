
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember, ProfessionalSchedule, Appointment } from '@/types';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeeklyCalendarProps {
  professional: TeamMember;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ professional }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [schedule, setSchedule] = useState<ProfessionalSchedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  useEffect(() => {
    fetchScheduleAndAppointments();
  }, [professional.id, currentWeek]);

  const fetchScheduleAndAppointments = async () => {
    setLoading(true);
    try {
      // Buscar horários do profissional
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('professional_schedules')
        .select('*')
        .eq('professional_id', professional.id)
        .eq('is_available', true);

      if (scheduleError) {
        console.error('Erro ao buscar horários:', scheduleError);
        return;
      }

      setSchedule(scheduleData || []);

      // Buscar agendamentos da semana
      const weekEndDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');
      const weekStartDate = format(weekStart, 'yyyy-MM-dd');

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_services (
            *,
            service:services (*)
          )
        `)
        .eq('professional_id', professional.id)
        .gte('appointment_date', weekStartDate)
        .lte('appointment_date', weekEndDate)
        .neq('status', 'cancelled');

      if (appointmentsError) {
        console.error('Erro ao buscar agendamentos:', appointmentsError);
        return;
      }

      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = (dayOfWeek: number) => {
    const daySchedule = schedule.find(s => s.day_of_week === dayOfWeek);
    if (!daySchedule) return [];

    const slots = [];
    const [startHour, startMinute] = daySchedule.start_time.split(':').map(Number);
    const [endHour, endMinute] = daySchedule.end_time.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    // Slots de 30 minutos
    for (let time = startTime; time < endTime; time += 30) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
    
    return slots;
  };

  const isSlotBooked = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.some(apt => {
      const aptDate = apt.appointment_date;
      const aptStart = apt.start_time;
      const aptEnd = apt.end_time;
      
      return aptDate === dateStr && time >= aptStart && time < aptEnd;
    });
  };

  const handleSlotClick = (date: Date, time: string) => {
    if (isSlotBooked(date, time)) return;
    
    // Aqui você implementaria a lógica para abrir o formulário de agendamento
    console.log('Slot selecionado:', format(date, 'dd/MM/yyyy'), time);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-salon-purple"></div>
          <span className="ml-2">Carregando agenda...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com navegação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl">
              {format(weekStart, 'dd/MM', { locale: ptBR })} - {format(addDays(weekStart, 6), 'dd/MM/yyyy', { locale: ptBR })}
            </CardTitle>
            <Button variant="outline" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Grid do calendário */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map((date, index) => {
          const dayOfWeek = date.getDay();
          const timeSlots = generateTimeSlots(dayOfWeek);
          const isToday = isSameDay(date, new Date());
          const isPast = date < new Date() && !isToday;

          return (
            <Card key={index} className={`${isToday ? 'ring-2 ring-salon-purple' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-center text-sm ${isPast ? 'text-gray-400' : ''}`}>
                  <div>{dayNames[dayOfWeek]}</div>
                  <div className="text-lg font-bold">
                    {format(date, 'dd/MM')}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {timeSlots.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-4">
                    Não disponível
                  </div>
                ) : (
                  timeSlots.map((time) => {
                    const isBooked = isSlotBooked(date, time);
                    const isDisabled = isPast || isBooked;
                    
                    return (
                      <Button
                        key={time}
                        variant={isBooked ? "destructive" : "outline"}
                        size="sm"
                        className={`w-full text-xs h-8 ${
                          isDisabled 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-salon-purple hover:text-white'
                        }`}
                        disabled={isDisabled}
                        onClick={() => handleSlotClick(date, time)}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {time}
                      </Button>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legenda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 border border-gray-300 rounded mr-2"></div>
              <span>Disponível</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
              <span>Ocupado</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
              <span>Indisponível</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyCalendar;
