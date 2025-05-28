
import React, { memo, useCallback } from 'react';
import { Appointment } from '@/types';
import AppointmentSlot from './AppointmentSlot';

interface TimeSlotProps {
  dateString: string;
  time: string;
  appointments: Appointment[];
  isBlocked: boolean;
  isPast: boolean;
  onSlotClick: (date: string, time: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointment: Appointment) => void;
  isFirstSlot: boolean;
  showAppointmentActions: boolean;
  onToggleAppointmentActions: () => void;
}

const TimeSlot = memo(({
  dateString,
  time,
  appointments,
  isBlocked,
  isPast,
  onSlotClick,
  onEditAppointment,
  onDeleteAppointment,
  isFirstSlot,
  showAppointmentActions,
  onToggleAppointmentActions
}: TimeSlotProps) => {
  const appointment = appointments[0];
  const isOccupied = appointments.length > 0;

  const handleSlotClick = useCallback(() => {
    if (!isBlocked && !isPast) {
      onSlotClick(dateString, time);
    }
  }, [dateString, time, isBlocked, isPast, onSlotClick]);

  // Renderizar slot de agendamento
  if (isOccupied && isFirstSlot && appointment) {
    return (
      <AppointmentSlot
        appointment={appointment}
        onEdit={onEditAppointment}
        onDelete={onDeleteAppointment}
        showActions={showAppointmentActions}
        onToggleActions={onToggleAppointmentActions}
      />
    );
  }

  // Renderizar continuação do agendamento
  if (isOccupied && !isFirstSlot) {
    return (
      <div 
        className="bg-blue-100 border-l-4 border-blue-500 h-full"
        aria-label="Continuação do agendamento"
      />
    );
  }

  // Renderizar slot disponível ou bloqueado
  const getSlotClasses = () => {
    if (isBlocked) {
      return 'bg-orange-100 border-l-4 border-orange-400 text-orange-700 cursor-not-allowed';
    }
    if (isPast) {
      return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    }
    return 'hover:bg-green-50 hover:border-l-4 hover:border-green-400 focus:bg-green-50 focus:border-l-4 focus:border-green-400 focus:outline-none cursor-pointer';
  };

  const getAriaLabel = () => {
    if (isBlocked) return `Horário ${time} indisponível`;
    if (isPast) return `Horário ${time} já passou`;
    return `Agendar horário ${time}`;
  };

  return (
    <button
      className={`w-full h-full text-xs transition-colors flex items-center justify-center ${getSlotClasses()}`}
      disabled={isBlocked || isPast}
      onClick={handleSlotClick}
      aria-label={getAriaLabel()}
      type="button"
    >
      {isBlocked && (
        <span className="text-orange-600 font-medium text-center px-1">
          Indisponível
        </span>
      )}
    </button>
  );
});

TimeSlot.displayName = 'TimeSlot';

export default TimeSlot;
