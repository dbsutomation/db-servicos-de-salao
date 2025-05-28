
import React, { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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

const AppointmentSlot = memo(({ 
  appointment, 
  onEdit, 
  onDelete, 
  showActions,
  onToggleActions 
}: AppointmentSlotProps) => {
  const startTime = sanitizeTimeString(appointment.start_time);
  const endTime = sanitizeTimeString(appointment.end_time);
  const isPast = isPastAppointment(appointment);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(appointment);
  }, [appointment, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(appointment);
  }, [appointment, onDelete]);

  const handleToggleActions = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleActions();
  }, [onToggleActions]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 h-full text-xs relative p-1 group">
          <div className="font-semibold text-xs truncate">
            {appointment.client_name || 'Cliente não identificado'}
          </div>
          <div className="text-xs text-blue-600 truncate">
            {appointment.service_name || 'Serviço não especificado'}
          </div>
          <div className="text-xs text-blue-500">
            {startTime} - {endTime}
          </div>
          
          {/* Botão de ações - sempre visível em mobile, hover em desktop */}
          {!isPast && (
            <div className="absolute top-1 right-1">
              {/* Botão de menu para mobile */}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 md:hidden bg-white/95 rounded"
                onClick={handleToggleActions}
                aria-label="Mostrar opções do agendamento"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>

              {/* Botões de ação para desktop (hover) e mobile (quando ações estão abertas) */}
              <div className={`flex space-x-1 bg-white/95 rounded p-1 ${
                showActions ? 'block' : 'hidden md:group-hover:flex'
              }`}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={handleEdit}
                  aria-label="Editar agendamento"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-red-100"
                  onClick={handleDelete}
                  aria-label="Excluir agendamento"
                >
                  <Trash2 className="h-3 w-3 text-red-600" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm max-w-xs">
          <p><strong>Cliente:</strong> {appointment.client_name || 'Não identificado'}</p>
          <p><strong>Serviço:</strong> {appointment.service_name || 'Não especificado'}</p>
          <p><strong>Horário:</strong> {startTime} - {endTime}</p>
          <p><strong>Valor:</strong> R$ {appointment.total_value || '0,00'}</p>
          {appointment.notes && (
            <p><strong>Observações:</strong> {appointment.notes}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

AppointmentSlot.displayName = 'AppointmentSlot';

export default AppointmentSlot;
