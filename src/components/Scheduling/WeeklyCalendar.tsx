
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { TeamMember, ProfessionalSchedule, Appointment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AppointmentForm } from './';
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeeklyCalendarProps {
  professional: TeamMember;
}

interface TimeSlot {
  time: string;
  isAvailable: boolean;
  isBooked: boolean;
  appointment?: Appointment;
}

const WeeklyCalendar = ({ professional }: WeeklyCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [schedules, setSchedules] = useState<ProfessionalSchedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  useEffect(() => {
    fetchScheduleData();
  }, [professional.id, currentWeek]);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      
      // Buscar horários do profissional
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('professional_schedules')
        .select('*')
        .eq('professional_id', professional.id);

      if (scheduleError) {
        console.error('Erro ao buscar horários:', scheduleError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os horários do profissional.",
          variant: "destructive",
        });
        return;
      }

      // Buscar agendamentos da semana
      const weekStart = format(currentWeek, 'yyyy-MM-dd');
      const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');

      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('professional_id', professional.id)
        .gte('appointment_date', weekStart)
        .lte('appointment_date', weekEnd);

      if (appointmentError) {
        console.error('Erro ao buscar agendamentos:', appointmentError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os agendamentos.",
          variant: "destructive",
        });
        return;
      }

      setSchedules(scheduleData || []);
      setAppointments(appointmentData || []);
    } catch (error) {
      console.error('Erro geral:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Converter domingo de 0 para 7
    const daySchedule = schedules.find(s => s.day_of_week === dayOfWeek);
    
    if (!daySchedule || !daySchedule.is_available) {
      return [];
    }

    const slots: TimeSlot[] = [];
    const startTime = daySchedule.start_time;
    const endTime = daySchedule.end_time;
    
    // Gerar slots de 30 em 30 minutos
    let currentTime = startTime;
    while (currentTime < endTime) {
      const dateString = format(date, 'yyyy-MM-dd');
      const isBooked = appointments.some(apt => 
        apt.appointment_date === dateString && 
        apt.start_time <= currentTime && 
        apt.end_time > currentTime
      );

      slots.push({
        time: currentTime,
        isAvailable: !isBooked,
        isBooked,
        appointment: appointments.find(apt => 
          apt.appointment_date === dateString && 
          apt.start_time <= currentTime && 
          apt.end_time > currentTime
        )
      });

      // Adicionar 30 minutos
      const [hours, minutes] = currentTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + 30;
      const newHours = Math.floor(totalMinutes / 60);
      const newMinutes = totalMinutes % 60;
      currentTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    }

    return slots;
  };

  const handleSlotClick = (date: Date, time: string, isAvailable: boolean) => {
    if (!isAvailable) return;
    
    setSelectedSlot({ date, time });
  };

  const handleAppointmentCreated = () => {
    setSelectedSlot(null);
    fetchScheduleData(); // Recarregar dados
    toast({
      title: "Agendamento criado",
      description: "Seu agendamento foi criado com sucesso!",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-salon-purple"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com navegação */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          Semana Anterior
        </Button>
        
        <h2 className="text-xl font-semibold">
          {format(currentWeek, 'dd/MM/yyyy', { locale: ptBR })} - {format(addDays(currentWeek, 6), 'dd/MM/yyyy', { locale: ptBR })}
        </h2>
        
        <Button
          variant="outline"
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
        >
          Próxima Semana
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Legenda */}
      <div className="flex gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm">Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm">Ocupado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span className="text-sm">Indisponível</span>
        </div>
      </div>

      {/* Grade do calendário */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date, index) => {
          const timeSlots = generateTimeSlots(date);
          
          return (
            <Card key={date.toISOString()} className="min-h-96">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-center">
                  {dayNames[index]}
                  <br />
                  <span className="text-xs font-normal">
                    {format(date, 'dd/MM')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 p-2">
                {timeSlots.length === 0 ? (
                  <div className="text-center text-gray-500 text-xs">
                    Não disponível
                  </div>
                ) : (
                  timeSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={slot.isAvailable ? "default" : "secondary"}
                      size="sm"
                      className={`w-full text-xs h-8 ${
                        slot.isAvailable 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : slot.isBooked 
                            ? 'bg-red-500 text-white cursor-not-allowed'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      }`}
                      onClick={() => handleSlotClick(date, slot.time, slot.isAvailable)}
                      disabled={!slot.isAvailable}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {slot.time}
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal do formulário de agendamento */}
      {selectedSlot && (
        <AppointmentForm
          professional={professional}
          selectedDate={selectedSlot.date}
          selectedTime={selectedSlot.time}
          onClose={() => setSelectedSlot(null)}
          onSuccess={handleAppointmentCreated}
        />
      )}
    </div>
  );
};

export default WeeklyCalendar;
