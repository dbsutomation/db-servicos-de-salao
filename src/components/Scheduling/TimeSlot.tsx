
import React, { memo, useCallback } from 'react';
import { Appointment } from '@/types';
import { AppointmentSlot } from './Slots/AppointmentSlot';

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

/**
 * Componente para renderizar um slot de tempo individual na grade
 * 
 * Responsável por determinar o tipo de conteúdo a ser exibido:
 * - Agendamento completo (primeira linha)
 * - Continuação de agendamento (linhas subsequentes)
 * - Slot disponível (livre para agendamento)
 * - Slot bloqueado (indisponível)
 * - Slot passado (não pode ser agendado)
 * 
 * @param dateString - Data do slot (YYYY-MM-DD)
 * @param time - Horário do slot (HH:MM)
 * @param appointments - Agendamentos que ocupam este slot
 * @param isBlocked - Se o slot está bloqueado
 * @param isPast - Se o slot já passou
 * @param onSlotClick - Callback para clique no slot
 * @param onEditAppointment - Callback para editar agendamento
 * @param onDeleteAppointment - Callback para excluir agendamento
 * @param isFirstSlot - Se é a primeira linha do agendamento
 * @param showAppointmentActions - Se as ações devem estar visíveis
 * @param onToggleAppointmentActions - Callback para alternar ações
 */
export const TimeSlot = memo(({
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

  /**
   * Manipula clique no slot vazio
   * Só permite agendamento se não estiver bloqueado ou no passado
   */
  const handleSlotClick = useCallback(() => {
    if (!isBlocked && !isPast) {
      onSlotClick(dateString, time);
    }
  }, [dateString, time, isBlocked, isPast, onSlotClick]);

  // Renderiza slot de agendamento completo (primeira linha)
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

  // Renderiza continuação do agendamento (linhas subsequentes)
  if (isOccupied && !isFirstSlot) {
    return (
      <div 
        className="bg-blue-50 h-full px-4 py-3"
        aria-label="Continuação do agendamento"
      />
    );
  }

  /**
   * Determina as classes CSS baseadas no status do slot
   * - Bloqueado: laranja com cursor não permitido
   * - Passado: cinza com cursor não permitido  
   * - Disponível: hover azul com cursor pointer
   */
  const getSlotClasses = () => {
    if (isBlocked) {
      return 'bg-orange-50 border-l-2 border-orange-300 text-orange-700 cursor-not-allowed';
    }
    if (isPast) {
      return 'bg-gray-50 text-gray-400 cursor-not-allowed';
    }
    return 'hover:bg-blue-50 focus:bg-blue-50 focus:outline-none cursor-pointer transition-colors duration-150';
  };

  /**
   * Gera label de acessibilidade apropriado
   */
  const getAriaLabel = () => {
    if (isBlocked) return `Horário ${time} indisponível`;
    if (isPast) return `Horário ${time} já passou`;
    return `Agendar horário ${time}`;
  };

  // Renderiza slot disponível, bloqueado ou passado
  return (
    <button
      className={`w-full h-full text-xs flex items-center justify-center px-4 py-3 ${getSlotClasses()}`}
      disabled={isBlocked || isPast}
      onClick={handleSlotClick}
      aria-label={getAriaLabel()}
      type="button"
    >
      {/* Indica visualmente que o slot está bloqueado */}
      {isBlocked && (
        <span className="text-orange-600 font-medium text-center px-2 py-1 bg-orange-100 rounded text-xs">
          Bloqueado
        </span>
      )}
    </button>
  );
});

TimeSlot.displayName = 'TimeSlot';
