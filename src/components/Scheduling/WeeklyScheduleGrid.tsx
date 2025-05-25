
import React from 'react';
import { format, addDays, startOfWeek, isSameDay, isToday, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/types';
import { Loader2 } from 'lucide-react';

interface WeeklyScheduleGridProps {
  currentWeek: Date;
  appointments: Appointment[];
  onSlotClick: (date: string, time: string) => void;
  loading: boolean;
}

const WeeklyScheduleGrid = ({
  currentWeek,
  appointments,
  onSlotClick,
  loading
}: WeeklyScheduleGridProps) => {
  //Dias disponíveis terça a sábado (length = 5); (week start i + 2 'domingo mais 2 = terça')
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i + 2));
  
  // Horários de funcionamento (8:00 às 19:00) com intervalos de 30 minutos
  const workingHours = Array.from({ length: 22 }, (_, i) => {
    const baseHour = 8 + Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    return `${baseHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });

  const isSlotOccupied = (date: Date, time: string) => {
    return appointments.some(appointment => {
      const appointmentDate = new Date(appointment.appointment_date);
      const appointmentStartTime = appointment.start_time.substring(0, 5);
      const appointmentEndTime = appointment.end_time.substring(0, 5);
      
      return isSameDay(appointmentDate, date) && 
             time >= appointmentStartTime && 
             time < appointmentEndTime;
    });
  };

  const isPastDate = (date: Date) => {
    // Usar apenas a data, sem horário, para comparação
    const today = new Date();
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return dateOnly < todayOnly;
  };

  const isPastTimeSlot = (date: Date, time: string) => {
    // Se não é hoje, não é passado baseado no horário
    if (!isToday(date)) return false;
    
    // Obter hora atual no fuso horário local (já considera UTC-3 automaticamente)
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    // Criar um horário de hoje com a hora do slot
    const slotDateTime = new Date();
    slotDateTime.setHours(hours, minutes, 0, 0);
    
    console.log('Checking time slot:', {
      now: now.toLocaleString('pt-BR'),
      slotDateTime: slotDateTime.toLocaleString('pt-BR'),
      time,
      currentHour: now.getHours(),
      currentMinute: now.getMinutes(),
      slotHour: hours,
      slotMinute: minutes,
      isPast: slotDateTime <= now
    });
    
    // Comparar apenas hora e minuto, ignorando segundos
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const slotTotalMinutes = hours * 60 + minutes;
    
    return slotTotalMinutes <= currentTotalMinutes;
  };

  const getSlotButtonProps = (date: Date, time: string) => {
    const isOccupied = isSlotOccupied(date, time);
    const isPastDateSlot = isPastDate(date);
    const isPastTime = isPastTimeSlot(date, time);
    
    if (isOccupied) {
      return {
        variant: "secondary" as const,
        className: 'bg-red-100 text-red-700 cursor-not-allowed',
        disabled: true,
        text: 'Ocupado'
      };
    }
    
    if (isPastDateSlot || isPastTime) {
      return {
        variant: "outline" as const,
        className: 'bg-red-500 text-white cursor-not-allowed',
        disabled: true,
        text: '—'
      };
    }
    
    return {
      variant: "outline" as const,
      className: 'hover:bg-green-100 hover:text-green-700',
      disabled: false,
      text: 'Livre'
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full">
        {/* Cabeçalho dos dias */}
        <div className="grid grid-cols-6 gap-1 mb-2">
          <div className="p-2 text-center font-semibold text-sm">Horário</div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="p-2 text-center font-semibold text-sm">
              <div>{format(day, 'EEE', { locale: ptBR })}</div>
              <div className="text-xs text-gray-500">
                {format(day, 'dd/MM', { locale: ptBR })}
              </div>
            </div>
          ))}
        </div>

        {/* Grid de horários */}
        <div className="space-y-1">
          {workingHours.map((time) => (
            <div key={time} className="grid grid-cols-6 gap-1">
              <div className="p-2 text-center text-sm font-medium bg-gray-50 rounded">
                {time}
              </div>
              {weekDays.map((day) => {
                const dateString = format(day, 'yyyy-MM-dd');
                const buttonProps = getSlotButtonProps(day, time);

                return (
                  <Button
                    key={`${dateString}-${time}`}
                    variant={buttonProps.variant}
                    size="sm"
                    className={`h-12 text-xs ${buttonProps.className}`}
                    disabled={buttonProps.disabled}
                    onClick={() => !buttonProps.disabled && onSlotClick(dateString, time)}
                  >
                    {buttonProps.text}
                  </Button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduleGrid;
