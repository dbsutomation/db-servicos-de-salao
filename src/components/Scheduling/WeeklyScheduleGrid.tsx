
import React from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/types';
import { Loader2 } from 'lucide-react';
import { useTimeValidation } from '@/hooks/useTimeValidation';

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
  const { isPastTimeSlot } = useTimeValidation();
  
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

  const getSlotButtonProps = (date: Date, time: string) => {
    const isOccupied = isSlotOccupied(date, time);
    const isPast = isPastTimeSlot(date, time);
    
    if (isOccupied) {
      return {
        variant: "secondary" as const,
        className: 'bg-red-100 text-red-700 cursor-not-allowed',
        disabled: true,
        text: 'Ocupado'
      };
    }
    
    if (isPast) {
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
