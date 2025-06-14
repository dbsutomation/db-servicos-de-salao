
import React, { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
import { Appointment } from '@/types';
import { sanitizeTimeString, isPastAppointment } from '@/utils/scheduleCalculations';

interface AppointmentSlotProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
  showActions: boolean;
  onToggleActions: () => void;
}

/**
 * Componente para exibir um slot de agendamento na grade
 * 
 * Responsável por:
 * - Mostrar informações do agendamento (cliente, serviço, horário, valor)
 * - Exibir ações de edição e exclusão (apenas para agendamentos futuros)
 * - Controlar visibilidade das ações em dispositivos móveis
 * - Aplicar estilos visuais apropriados baseados no status
 * 
 * @param appointment - Dados do agendamento a ser exibido
 * @param onEdit - Callback para editar o agendamento
 * @param onDelete - Callback para excluir o agendamento
 * @param showActions - Se as ações devem estar visíveis
 * @param onToggleActions - Callback para alternar visibilidade das ações
 */
export const AppointmentSlot = memo(({ 
  appointment, 
  onEdit, 
  onDelete, 
  showActions,
  onToggleActions 
}: AppointmentSlotProps) => {
  // Sanitiza os horários removendo segundos se existirem
  const startTime = sanitizeTimeString(appointment.start_time);
  const endTime = sanitizeTimeString(appointment.end_time);
  
  // Verifica se o agendamento já passou (para desabilitar ações)
  const isPast = isPastAppointment(appointment);

  /**
   * Manipula clique no botão de editar
   * Previne propagação do evento e executa callback
   */
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(appointment);
  }, [appointment, onEdit]);

  /**
   * Manipula clique no botão de excluir
   * Previne propagação do evento e executa callback
   */
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(appointment);
  }, [appointment, onDelete]);

  /**
   * Manipula clique no botão de ações (mobile)
   * Alterna visibilidade do menu de ações
   */
  const handleToggleActions = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleActions();
  }, [onToggleActions]);

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 h-full text-xs relative group transition-all duration-200 hover:bg-blue-100 hover:shadow-sm rounded-r-md px-4 py-3">
      {/* Nome do cliente */}
      <div className="font-semibold text-sm text-blue-900 truncate mb-1">
        {appointment.client_name || 'Cliente não identificado'}
      </div>
      
      {/* Nome do serviço */}
      <div className="text-xs text-blue-700 truncate mb-1 font-medium">
        {appointment.service_name || 'Serviço não especificado'}
      </div>
      
      {/* Horário do agendamento */}
      <div className="text-xs text-blue-600 mb-1 font-medium">
        {startTime} - {endTime}
      </div>
      
      {/* Valor do serviço */}
      <div className="text-xs text-blue-800 font-semibold">
        R$ {appointment.total_value || '0,00'}
      </div>
      
      {/* Observações (se existirem) */}
      {appointment.notes && (
        <div className="text-xs text-blue-600 mt-1 truncate opacity-80">
          {appointment.notes}
        </div>
      )}
      
      {/* Ações (editar/excluir) - apenas para agendamentos futuros */}
      {!isPast && (
        <div className="absolute top-2 right-2">
          {/* Botão de ações para mobile */}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 md:hidden bg-white/90 rounded shadow-sm border border-blue-200"
            onClick={handleToggleActions}
            aria-label="Mostrar opções do agendamento"
          >
            <MoreVertical className="h-3 w-3 text-blue-600" />
          </Button>

          {/* Container das ações (visível no hover em desktop ou quando ativo em mobile) */}
          <div className={`flex space-x-1 bg-white/95 rounded shadow-sm border border-blue-200 p-1 ${
            showActions ? 'block' : 'hidden md:group-hover:flex'
          }`}>
            {/* Botão de editar */}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-blue-50"
              onClick={handleEdit}
              aria-label="Editar agendamento"
            >
              <Edit className="h-3 w-3 text-blue-600" />
            </Button>
            
            {/* Botão de excluir */}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-red-50"
              onClick={handleDelete}
              aria-label="Excluir agendamento"
            >
              <Trash2 className="h-3 w-3 text-red-600" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

AppointmentSlot.displayName = 'AppointmentSlot';
