
import React, { memo } from 'react';
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

  if (isOccupied && !isFirstSlot) {
    return <div className="bg-blue-100 border-l-4 border-blue-500 h-full" />;
  }

  return (
    <button
      className={`w-full h-full text-xs transition-colors ${
        isBlocked 
          ? 'bg-orange-100 border-l-4 border-orange-400 text-orange-700 cursor-not-allowed' 
          : isPast 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'hover:bg-green-50 hover:border-l-4 hover:border-green-400 cursor-pointer focus:bg-green-50 focus:border-l-4 focus:border-green-400 focus:outline-none'
      }`}
      disabled={isBlocked || isPast}
      onClick={() => !isBlocked && !isPast && onSlotClick(dateString, time)}
      aria-label={`Agendar horário ${time} ${isBlocked ? '(indisponível)' : isPast ? '(horário passado)' : ''}`}
    >
      {isBlocked && (
        <span className="text-orange-600 font-medium">Indisponível</span>
      )}
    </button>
  );
});

TimeSlot.displayName = 'TimeSlot';

export default TimeSlot;
