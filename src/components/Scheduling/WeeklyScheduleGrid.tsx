
import React, { useMemo, useState, useCallback } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment } from '@/types';
import { Loader2 } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import TimeSlot from './TimeSlot';
import {
  isPastTimeSlot,
  getAppointmentsForSlot,
  isFirstSlotOfAppointment,
  generateWorkingHours,
  generateMainHours
} from '@/utils/scheduleUtils';

interface WeeklyScheduleGridProps {
  currentWeek: Date;
  appointments: Appointment[];
  onSlotClick: (date: string, time: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointment: Appointment) => void;
  loading: boolean;
  isSlotBlocked?: (date: string, time: string) => boolean;
}

const WeeklyScheduleGrid = ({
  currentWeek,
  appointments,
  onSlotClick,
  onEditAppointment,
  onDeleteAppointment,
  loading,
  isSlotBlocked = () => false
}: WeeklyScheduleGridProps) => {
  const [activeAppointmentSlot, setActiveAppointmentSlot] = useState<string | null>(null);

  // Memoização dos cálculos estáticos
  const { weekDays, workingHours, mainHours } = useMemo(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
    const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i + 1));
    
    return {
      weekDays: days,
      workingHours: generateWorkingHours(),
      mainHours: generateMainHours()
    };
  }, [currentWeek]);

  const handleToggleAppointmentActions = useCallback((slotKey: string) => {
    setActiveAppointmentSlot(prev => prev === slotKey ? null : slotKey);
  }, []);

  const handleSlotClick = useCallback((date: string, time: string) => {
    setActiveAppointmentSlot(null); // Fechar ações abertas
    onSlotClick(date, time);
  }, [onSlotClick]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="Carregando agenda" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header da grade */}
        <div className="grid grid-cols-6 border-b border-gray-200 bg-gray-50">
          <div className="p-3 text-sm font-medium text-gray-600 border-r border-gray-200">
            Horário
          </div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="p-3 text-center border-l border-gray-200">
              <div className="text-sm font-bold text-blue-600">
                {format(day, 'd')}
              </div>
              <div className="text-xs font-medium text-gray-900 uppercase">
                {format(day, 'EEEE', { locale: ptBR })}
              </div>
              <div className="text-xs text-gray-500">
                {format(day, 'dd/MM', { locale: ptBR })}
              </div>
            </div>
          ))}
        </div>

        {/* Grid de horários */}
        <div className="max-h-96 overflow-y-auto">
          {mainHours.map((mainHour) => {
            const hourSlots = workingHours.filter(time => 
              time.startsWith(mainHour.substring(0, 2))
            );
            
            return (
              <div key={mainHour}>
                {hourSlots.map((time, slotIndex) => (
                  <div key={time} className="grid grid-cols-6 border-b border-gray-100 hover:bg-gray-50 h-12">
                    {/* Coluna de horários */}
                    <div className="p-2 text-xs font-medium text-gray-600 border-r border-gray-200 bg-gray-50 flex items-center">
                      {slotIndex === 0 ? mainHour : ''}
                    </div>
                    
                    {/* Colunas dos dias */}
                    {weekDays.map((day) => {
                      const dateString = format(day, 'yyyy-MM-dd');
                      const slotAppointments = getAppointmentsForSlot(appointments, day, time);
                      const appointment = slotAppointments[0];
                      const isPast = isPastTimeSlot(day, time);
                      const isBlocked = isSlotBlocked(dateString, time);
                      const isFirstSlot = appointment && isFirstSlotOfAppointment(time, appointment);
                      const slotKey = `${dateString}-${time}`;

                      return (
                        <div key={slotKey} className="relative border-l border-gray-200">
                          <TimeSlot
                            dateString={dateString}
                            time={time}
                            appointments={slotAppointments}
                            isBlocked={isBlocked}
                            isPast={isPast}
                            onSlotClick={handleSlotClick}
                            onEditAppointment={onEditAppointment}
                            onDeleteAppointment={onDeleteAppointment}
                            isFirstSlot={isFirstSlot}
                            showAppointmentActions={activeAppointmentSlot === slotKey}
                            onToggleAppointmentActions={() => handleToggleAppointmentActions(slotKey)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default WeeklyScheduleGrid;
