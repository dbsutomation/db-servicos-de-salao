
import React, { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
import { Appointment } from '@/types';
import { sanitizeTimeString, isPastAppointment } from '@/utils/scheduleCalculations';

/**
 * Interface para as propriedades do componente AppointmentSlot
 * 
 * @interface AppointmentSlotProps
 * @property {Appointment} appointment - Dados completos do agendamento
 * @property {Function} onEdit - Callback para iniciar edição do agendamento
 * @property {Function} onDelete - Callback para iniciar exclusão do agendamento
 * @property {boolean} showActions - Controla visibilidade das ações (editar/excluir)
 * @property {Function} onToggleActions - Callback para alternar visibilidade das ações
 */
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
 * Este componente é responsável por renderizar todas as informações de um agendamento
 * existente dentro de um slot da agenda. Principais funcionalidades:
 * 
 * Informações exibidas:
 * - Nome do cliente com fallback para casos não identificados
 * - Nome do serviço com fallback para casos não especificados
 * - Horário de início e fim (sanitizado para remover segundos)
 * - Valor total do serviço formatado como moeda brasileira
 * - Observações do agendamento (quando existirem)
 * 
 * Funcionalidades interativas:
 * - Ações de edição e exclusão (apenas para agendamentos futuros)
 * - Controle de visibilidade das ações para dispositivos móveis
 * - Hover effects para melhor experiência do usuário
 * - Prevenção de propagação de eventos para evitar conflitos
 * 
 * Acessibilidade:
 * - Labels ARIA apropriadas para todas as ações
 * - Indicadores visuais claros para diferentes estados
 * - Suporte completo a navegação por teclado
 * 
 * Performance:
 * - Memoização do componente para evitar re-renders desnecessários
 * - Callbacks otimizados com useCallback
 * - Cálculos de estado realizados apenas quando necessário
 * 
 * @param {AppointmentSlotProps} props - Propriedades do componente
 * @returns {JSX.Element} Componente do slot de agendamento renderizado
 */
export const AppointmentSlot = memo(({ 
  appointment, 
  onEdit, 
  onDelete, 
  showActions,
  onToggleActions 
}: AppointmentSlotProps) => {
  
  // === PROCESSAMENTO DE DADOS ===
  
  /**
   * Sanitização dos horários para exibição
   * Remove segundos dos horários se existirem (ex: 09:00:00 -> 09:00)
   * Garante formato consistente e limpo para o usuário
   */
  const startTime = sanitizeTimeString(appointment.start_time);
  const endTime = sanitizeTimeString(appointment.end_time);
  
  /**
   * Verificação se o agendamento já passou
   * Usado para determinar se as ações de edição/exclusão devem estar disponíveis
   * Agendamentos passados não podem ser modificados por regras de negócio
   */
  const isPast = isPastAppointment(appointment);

  // === HANDLERS DE EVENTOS ===
  
  /**
   * Manipula clique no botão de editar
   * 
   * Responsabilidades:
   * - Prevenir propagação do evento para evitar ações indesejadas
   * - Executar callback de edição passado pelo componente pai
   * 
   * @param {React.MouseEvent} e - Evento de clique do mouse
   */
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(appointment);
  }, [appointment, onEdit]);

  /**
   * Manipula clique no botão de excluir
   * 
   * Responsabilidades:
   * - Prevenir propagação do evento para evitar ações indesejadas
   * - Executar callback de exclusão passado pelo componente pai
   * 
   * @param {React.MouseEvent} e - Evento de clique do mouse
   */
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(appointment);
  }, [appointment, onDelete]);

  /**
   * Manipula clique no botão de ações (menu de três pontos em mobile)
   * 
   * Responsabilidades:
   * - Prevenir propagação do evento
   * - Alternar visibilidade do menu de ações em dispositivos móveis
   * 
   * @param {React.MouseEvent} e - Evento de clique do mouse
   */
  const handleToggleActions = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleActions();
  }, [onToggleActions]);

  // === RENDERIZAÇÃO PRINCIPAL ===
  
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 h-full text-xs relative group transition-all duration-200 hover:bg-blue-100 hover:shadow-sm rounded-r-md px-4 py-3">
      
      {/* === INFORMAÇÕES DO AGENDAMENTO === */}
      
      {/* Nome do cliente com fallback */}
      <div className="font-semibold text-sm text-blue-900 truncate mb-1">
        {appointment.client_name || 'Cliente não identificado'}
      </div>
      
      {/* Nome do serviço com fallback */}
      <div className="text-xs text-blue-700 truncate mb-1 font-medium">
        {appointment.service_name || 'Serviço não especificado'}
      </div>
      
      {/* Horário formatado do agendamento */}
      <div className="text-xs text-blue-600 mb-1 font-medium">
        {startTime} - {endTime}
      </div>
      
      {/* Valor do serviço formatado como moeda brasileira */}
      <div className="text-xs text-blue-800 font-semibold">
        R$ {appointment.total_value || '0,00'}
      </div>
      
      {/* Observações condicionais - só aparece se existirem */}
      {appointment.notes && (
        <div className="text-xs text-blue-600 mt-1 truncate opacity-80">
          {appointment.notes}
        </div>
      )}
      
      {/* === AÇÕES DE EDIÇÃO/EXCLUSÃO === */}
      {/* Só renderiza para agendamentos futuros */}
      {!isPast && (
        <div className="absolute top-2 right-2">
          
          {/* Botão de ações para dispositivos móveis */}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 md:hidden bg-white/90 rounded shadow-sm border border-blue-200"
            onClick={handleToggleActions}
            aria-label="Mostrar opções do agendamento"
          >
            <MoreVertical className="h-3 w-3 text-blue-600" />
          </Button>

          {/* Container das ações principais */}
          {/* Visível no hover em desktop ou quando ativo em mobile */}
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

// Nome de exibição para ferramentas de debug
AppointmentSlot.displayName = 'AppointmentSlot';
