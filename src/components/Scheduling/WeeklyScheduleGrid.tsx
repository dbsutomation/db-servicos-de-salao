
import React, { useMemo, useState, useCallback } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment } from '@/types';
import { Loader2 } from 'lucide-react';
import TimeSlot from './TimeSlot';
import {
  isPastTimeSlot,
  getAppointmentsForSlot,
  isFirstSlotOfAppointment,
  generateMainHours
} from '@/utils/scheduleCalculations';

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

  // Memoização dos cálculos estáticos - usando apenas horários inteiros
  const { weekDays, mainHours } = useMemo(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
    const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i + 1));
    
    return {
      weekDays: days,
      mainHours: generateMainHours() // Apenas horários inteiros
    };
  }, [currentWeek]);

  const handleToggleAppointmentActions = useCallback((slotKey: string) => {
    setActiveAppointmentSlot(prev => prev === slotKey ? null : slotKey);
  }, []);

  const handleSlotClick = useCallback((date: string, time: string) => {
    setActiveAppointmentSlot(null);
    onSlotClick(date, time);
  }, [onSlotClick]);

  const handleGridClick = useCallback(() => {
    setActiveAppointmentSlot(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-label="Carregando agenda" />
        <span className="sr-only">Carregando agenda...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100" onClick={handleGridClick}>
      {/* Header da grade - alinhamento corrigido */}
      <div className="grid bg-gray-50 border-b border-gray-200" style={{ gridTemplateColumns: '140px repeat(6, 1fr)' }}>
        <div className="px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200 flex items-center justify-center min-h-[70px] bg-white">
          Horário
        </div>
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="px-4 py-3 text-center border-r border-gray-200 last:border-r-0 min-h-[70px] flex flex-col justify-center bg-gray-50">
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
              {format(day, 'EEEE', { locale: ptBR })}
            </div>
            <div className="text-lg font-bold text-gray-900">
              {format(day, 'd')}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {format(day, 'dd/MM', { locale: ptBR })}
            </div>
          </div>
        ))}
      </div>

      {/* Grid de horários - alinhamento corrigido */}
      <div className="max-h-[500px] overflow-y-auto">
        {mainHours.map((time) => (
          <div key={time} className="grid border-b border-gray-200 last:border-b-0 min-h-[60px] hover:bg-gray-25 transition-colors" style={{ gridTemplateColumns: '140px repeat(6, 1fr)' }}>
            {/* Coluna de horários - padding igual ao header */}
            <div className="px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200 bg-gray-100 flex items-center justify-center">
              {time}
            </div>
            
            {/* Colunas dos dias - padding igual ao header */}
            {weekDays.map((day) => {
              const dateString = format(day, 'yyyy-MM-dd');
              const slotAppointments = getAppointmentsForSlot(appointments, day, time);
              const appointment = slotAppointments[0];
              const isPast = isPastTimeSlot(day, time);
              const isBlocked = isSlotBlocked(dateString, time);
              const isFirstSlot = appointment && isFirstSlotOfAppointment(time, appointment);
              const slotKey = `${dateString}-${time}`;

              return (
                <div 
                  key={slotKey} 
                  className="px-4 pay-3 relative border-r border-gray-200 last:border-r-0 min-h-[100px] hover:bg-blue-25 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
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
    </div>
  );
};

export default WeeklyScheduleGrid;
