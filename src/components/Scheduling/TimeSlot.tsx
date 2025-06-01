
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

  // Renderizar slot de agendamento completo - ajuste para padding do container
  if (isOccupied && isFirstSlot && appointment) {
    return (
      <div className="h-full -mx-4 px-4">
        <AppointmentSlot
          appointment={appointment}
          onEdit={onEditAppointment}
          onDelete={onDeleteAppointment}
          showActions={showAppointmentActions}
          onToggleActions={onToggleAppointmentActions}
        />
      </div>
    );
  }

  // Renderizar continuação do agendamento - ajuste para padding do container
  if (isOccupied && !isFirstSlot) {
    return (
      <div 
        className="bg-blue-50 h-full -mx-4"
        aria-label="Continuação do agendamento"
      />
    );
  }

  // Renderizar slot disponível ou bloqueado - ajuste para padding do container
  const getSlotClasses = () => {
    if (isBlocked) {
      return 'bg-orange-50 border-l-2 border-orange-300 text-orange-700 cursor-not-allowed -mx-4 px-4';
    }
    if (isPast) {
      return 'bg-gray-50 text-gray-400 cursor-not-allowed -mx-4 px-4';
    }
    return 'hover:bg-blue-50 focus:bg-blue-50 focus:outline-none cursor-pointer transition-colors duration-150 -mx-4 px-4';
  };

  const getAriaLabel = () => {
    if (isBlocked) return `Horário ${time} indisponível`;
    if (isPast) return `Horário ${time} já passou`;
    return `Agendar horário ${time}`;
  };

  return (
    <button
      className={`w-full h-full text-xs flex items-center justify-center ${getSlotClasses()}`}
      disabled={isBlocked || isPast}
      onClick={handleSlotClick}
      aria-label={getAriaLabel()}
      type="button"
    >
      {isBlocked && (
        <span className="text-orange-600 font-medium text-center px-2 py-1 bg-orange-100 rounded text-xs">
          Bloqueado
        </span>
      )}
    </button>
  );
});

TimeSlot.displayName = 'TimeSlot';

export default TimeSlot;
