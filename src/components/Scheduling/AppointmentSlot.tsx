
import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Trash2 } from 'lucide-react';
import { Appointment } from '@/types';
import { safeTimeExtraction, isPastAppointment } from '@/utils/scheduleUtils';

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
  const startTime = safeTimeExtraction(appointment.start_time);
  const endTime = safeTimeExtraction(appointment.end_time);
  const isPast = isPastAppointment(appointment);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 cursor-pointer hover:bg-blue-200 h-full text-xs relative p-1"
          onClick={onToggleActions}
        >
          <div className="font-semibold text-xs truncate">
            {appointment.client_name || 'Cliente não identificado'}
          </div>
          <div className="text-xs text-blue-600 truncate">
            {appointment.service_name || 'Serviço não especificado'}
          </div>
          <div className="text-xs text-blue-500">
            {startTime} - {endTime}
          </div>
          
          {/* Botões de ação - visíveis no mobile ao clicar */}
          {!isPast && showActions && (
            <div className="absolute top-1 right-1 flex space-x-1 bg-white/95 rounded p-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(appointment);
                }}
                aria-label="Editar agendamento"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-red-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(appointment);
                }}
                aria-label="Excluir agendamento"
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
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
