
import React, { useMemo, useState, useCallback } from 'react';
import { addDays, startOfWeek } from 'date-fns';
import { Appointment } from '@/types';
import { Loader2 } from 'lucide-react';
import { GridHeader } from './GridHeader';
import { TimeRow } from './TimeRow';
import { generateMainHours } from '@/utils/scheduleCalculations';

interface WeeklyScheduleGridProps {
  currentWeek: Date;
  appointments: Appointment[];
  onSlotClick: (date: string, time: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointment: Appointment) => void;
  loading: boolean;
  isSlotBlocked?: (date: string, time: string) => boolean;
}

export const WeeklyScheduleGrid = ({
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
  const { weekDays, mainHours } = useMemo(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
    const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i + 1));
    
    return {
      weekDays: days,
      mainHours: generateMainHours()
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
      {/* Header da grade */}
      <GridHeader weekDays={weekDays} />

      {/* Grid de horários */}
      <div className="max-h-[500px] overflow-y-auto">
        {mainHours.map((time) => (
          <TimeRow
            key={time}
            time={time}
            weekDays={weekDays}
            appointments={appointments}
            onSlotClick={handleSlotClick}
            onEditAppointment={onEditAppointment}
            onDeleteAppointment={onDeleteAppointment}
            isSlotBlocked={isSlotBlocked}
            activeAppointmentSlot={activeAppointmentSlot}
            onToggleAppointmentActions={handleToggleAppointmentActions}
          />
        ))}
      </div>
    </div>
  );
};
