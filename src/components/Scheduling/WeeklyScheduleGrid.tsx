
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
  
  // Horários de funcionamento (8:00 às 17:00) com intervalos de 1 hora
  const workingHours = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
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

  const getAppointmentForSlot = (date: Date, time: string) => {
    return appointments.find(appointment => {
      const appointmentDate = new Date(appointment.appointment_date);
      const appointmentStartTime = appointment.start_time.substring(0, 5);
      
      return isSameDay(appointmentDate, date) && appointmentStartTime === time;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white">
      <div className="min-w-full">
        {/* Cabeçalho dos dias - estilo idêntico à imagem */}
        <div className="grid grid-cols-6 border-b border-gray-200">
          <div className="p-4 bg-gray-50 border-r border-gray-200"></div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="p-4 text-center bg-gray-50 border-r border-gray-200 last:border-r-0">
              <div className="flex flex-col items-center">
                <div className="text-sm font-semibold text-blue-600 mb-1">
                  {format(day, 'dd', { locale: ptBR })}
                </div>
                <div className="text-xs text-gray-600 uppercase">
                  {format(day, 'EEEE', { locale: ptBR })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Grid de horários - estilo idêntico à imagem */}
        <div className="divide-y divide-gray-200">
          {workingHours.map((time) => (
            <div key={time} className="grid grid-cols-6 min-h-[80px]">
              {/* Coluna de horário */}
              <div className="p-2 text-center text-xs text-gray-500 bg-gray-50 border-r border-gray-200 flex items-start justify-center pt-2">
                {time}
              </div>
              
              {/* Colunas dos dias */}
              {weekDays.map((day) => {
                const dateString = format(day, 'yyyy-MM-dd');
                const isOccupied = isSlotOccupied(day, time);
                const isPast = isPastTimeSlot(day, time);
                const appointment = getAppointmentForSlot(day, time);

                return (
                  <div
                    key={`${dateString}-${time}`}
                    className="relative border-r border-gray-200 last:border-r-0 min-h-[80px] hover:bg-gray-50 cursor-pointer"
                    onClick={() => !isOccupied && !isPast && onSlotClick(dateString, time)}
                  >
                    {appointment && (
                      <div className="absolute inset-1 bg-blue-100 border border-blue-300 rounded p-2 shadow-sm">
                        <div className="text-xs font-semibold text-blue-800 mb-1">
                          {appointment.client_name}
                        </div>
                        <div className="text-xs text-blue-600">
                          {appointment.service_name}
                        </div>
                        <div className="text-xs text-blue-500 mt-1">
                          {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}
                        </div>
                      </div>
                    )}
                    
                    {!appointment && isPast && (
                      <div className="absolute inset-0 bg-gray-100 opacity-50"></div>
                    )}
                  </div>
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
