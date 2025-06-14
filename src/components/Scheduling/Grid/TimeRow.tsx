
import React from 'react';
import { format } from 'date-fns';
import { Appointment } from '@/types';
import { GridCell } from './GridCell';
import { TimeSlot } from '../Slots/TimeSlot';
import {
  getAppointmentsForSlot,
  isPastTimeSlot,
  isFirstSlotOfAppointment
} from '@/utils/scheduleCalculations';

interface TimeRowProps {
  time: string;
  weekDays: Date[];
  appointments: Appointment[];
  onSlotClick: (date: string, time: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointment: Appointment) => void;
  isSlotBlocked: (date: string, time: string) => boolean;
  activeAppointmentSlot: string | null;
  onToggleAppointmentActions: (slotKey: string) => void;
}

export const TimeRow = ({
  time,
  weekDays,
  appointments,
  onSlotClick,
  onEditAppointment,
  onDeleteAppointment,
  isSlotBlocked,
  activeAppointmentSlot,
  onToggleAppointmentActions
}: TimeRowProps) => {
  return (
    <div 
      className="grid border-b border-gray-100 last:border-b-0 min-h-[70px] hover:bg-gray-25 transition-colors" 
      style={{ gridTemplateColumns: '140px repeat(6, 1fr)' }}
    >
      {/* Coluna de horários */}
      <GridCell className="text-sm font-medium text-gray-600 bg-gray-50 flex items-center justify-center">
        {time}
      </GridCell>
      
      {/* Colunas dos dias */}
      {weekDays.map((day) => {
        const dateString = format(day, 'yyyy-MM-dd');
        const slotAppointments = getAppointmentsForSlot(appointments, day, time);
        const appointment = slotAppointments[0];
        const isPast = isPastTimeSlot(day, time);
        const isBlocked = isSlotBlocked(dateString, time);
        
        // Determina se é primeira linha do agendamento
        const isFirstSlot = appointment ? isFirstSlotOfAppointment(time, appointment) : false;
        const slotKey = `${dateString}-${time}`;

        return (
          <div 
            key={slotKey} 
            className="border-r border-gray-100 last:border-r-0 min-h-[60px] hover:bg-blue-25 transition-colors relative"
            onClick={(e) => e.stopPropagation()}
          >
            <TimeSlot
              dateString={dateString}
              time={time}
              appointments={slotAppointments}
              isBlocked={isBlocked}
              isPast={isPast}
              onSlotClick={onSlotClick}
              onEditAppointment={onEditAppointment}
              onDeleteAppointment={onDeleteAppointment}
              isFirstSlot={isFirstSlot}
              showAppointmentActions={activeAppointmentSlot === slotKey}
              onToggleAppointmentActions={() => onToggleAppointmentActions(slotKey)}
            />
          </div>
        );
      })}
    </div>
  );
};
