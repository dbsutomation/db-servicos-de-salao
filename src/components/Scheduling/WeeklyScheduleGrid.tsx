
import React from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
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
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Horários de funcionamento (7:00 às 22:00)
  const workingHours = Array.from({ length: 15 }, (_, i) => {
    const hour = 7 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
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
        <div className="grid grid-cols-8 gap-1 mb-2">
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
            <div key={time} className="grid grid-cols-8 gap-1">
              <div className="p-2 text-center text-sm font-medium bg-gray-50 rounded">
                {time}
              </div>
              {weekDays.map((day) => {
                const isOccupied = isSlotOccupied(day, time);
                const isPast = isPastDate(day);
                const dateString = format(day, 'yyyy-MM-dd');

                return (
                  <Button
                    key={`${dateString}-${time}`}
                    variant={isOccupied ? "secondary" : "outline"}
                    size="sm"
                    className={`h-12 text-xs ${
                      isOccupied 
                        ? 'bg-red-100 text-red-700 cursor-not-allowed' 
                        : isPast 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'hover:bg-green-100 hover:text-green-700'
                    }`}
                    disabled={isOccupied || isPast}
                    onClick={() => !isOccupied && !isPast && onSlotClick(dateString, time)}
                  >
                    {isOccupied ? 'Ocupado' : 'Livre'}
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
