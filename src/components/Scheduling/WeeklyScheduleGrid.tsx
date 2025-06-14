import React, { useMemo, useState, useCallback } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment } from '@/types';
import { Loader2 } from 'lucide-react';
import { TimeSlot } from './TimeSlot';
import {
  isPastTimeSlot,
  getAppointmentsForSlot,
  isFirstSlotOfAppointment,
  generateMainHours
} from '@/utils/scheduleCalculations';

interface WeeklyScheduleGridProps {
  currentWeek: Date;
  appointments: Appointment[];
  onSlotClick: (date: string, time: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointment: Appointment) => void;
  loading: boolean;
  isSlotBlocked?: (date: string, time: string) => boolean;
}

/**
 * Componente principal da grade semanal de agendamentos
 * 
 * Responsável por renderizar uma visualização em grade dos horários disponíveis
 * para agendamento durante uma semana (segunda a sábado), incluindo:
 * - Navegação entre semanas
 * - Visualização de agendamentos existentes
 * - Interação para criar novos agendamentos
 * - Edição e exclusão de agendamentos
 * 
 * @param currentWeek - Data da semana atual sendo exibida
 * @param appointments - Lista de agendamentos para exibir
 * @param onSlotClick - Callback para quando um slot é clicado
 * @param onEditAppointment - Callback para editar agendamento
 * @param onDeleteAppointment - Callback para excluir agendamento
 * @param loading - Estado de carregamento
 * @param isSlotBlocked - Função para verificar se um slot está bloqueado
 */
const WeeklyScheduleGrid = ({
  currentWeek,
  appointments,
  onSlotClick,
  onEditAppointment,
  onDeleteAppointment,
  loading,
  isSlotBlocked = () => false
}: WeeklyScheduleGridProps) => {
  // Estado para controlar qual agendamento está com ações visíveis
  const [activeAppointmentSlot, setActiveAppointmentSlot] = useState<string | null>(null);

  /**
   * Memoização dos cálculos estáticos para otimização de performance
   * - weekDays: Array com os dias da semana (segunda a sábado)
   * - mainHours: Array com os horários de trabalho (apenas horários inteiros)
   */
  const { weekDays, mainHours } = useMemo(() => {
    // Calcula o início da semana (domingo = 0)
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
    // Gera array com 6 dias (segunda a sábado)
    const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i + 1));
    
    return {
      weekDays: days,
      mainHours: generateMainHours() // Apenas horários inteiros (ex: 09:00, 10:00)
    };
  }, [currentWeek]);

  /**
   * Alterna a visibilidade das ações de um agendamento específico
   * Usado para mostrar/ocultar botões de editar e excluir em mobile
   */
  const handleToggleAppointmentActions = useCallback((slotKey: string) => {
    setActiveAppointmentSlot(prev => prev === slotKey ? null : slotKey);
  }, []);

  /**
   * Manipula o clique em um slot da grade
   * Fecha ações abertas e executa callback de clique no slot
   */
  const handleSlotClick = useCallback((date: string, time: string) => {
    setActiveAppointmentSlot(null);
    onSlotClick(date, time);
  }, [onSlotClick]);

  /**
   * Manipula cliques na grade para fechar ações abertas
   * Evita que ações fichem abertas quando usuário clica fora
   */
  const handleGridClick = useCallback(() => {
    setActiveAppointmentSlot(null);
  }, []);

  // Renderiza estado de carregamento
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-label="Carregando agenda" />
        <span className="sr-only">Carregando agenda...</span>
      </div>
    );
  }

  /**
   * Estilos consistentes para todas as células da grade
   * Garante alinhamento perfeito entre header e corpo
   */
  const cellStyles = 'px-4 py-3';
  const timeCellStyles = `${cellStyles} text-sm font-medium text-gray-600 border-r border-gray-100 bg-gray-50 flex items-center justify-center`;
  const dayCellStyles = `${cellStyles} text-center border-r border-gray-200 last:border-r-0 min-h-[70px] flex flex-col justify-center bg-gray-50`;
  const slotCellStyles = 'border-r border-gray-100 last:border-r-0 min-h-[60px] hover:bg-blue-25 transition-colors relative';

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100" onClick={handleGridClick}>
      {/* Header da grade com dias da semana */}
      <div className="grid bg-gray-50 border-b border-gray-200" style={{ gridTemplateColumns: '140px repeat(6, 1fr)' }}>
        {/* Célula do cabeçalho "Horário" */}
        <div className={`${cellStyles} text-sm font-semibold text-gray-700 border-r border-gray-200 flex items-center justify-center min-h-[70px] bg-white`}>
          Horário
        </div>
        
        {/* Células dos dias da semana */}
        {weekDays.map((day) => (
          <div key={day.toISOString()} className={dayCellStyles}>
            {/* Nome do dia da semana */}
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
              {format(day, 'EEEE', { locale: ptBR })}
            </div>
            {/* Número do dia */}
            <div className="text-lg font-bold text-gray-900">
              {format(day, 'd')}
            </div>
            {/* Data formatada */}
            <div className="text-xs text-gray-500 mt-1">
              {format(day, 'dd/MM', { locale: ptBR })}
            </div>
          </div>
        ))}
      </div>

      {/* Grade de horários com scroll vertical */}
      <div className="max-h-[500px] overflow-y-auto">
        {mainHours.map((time) => (
          <div 
            key={time} 
            className="grid border-b border-gray-100 last:border-b-0 min-h-[70px] hover:bg-gray-25 transition-colors" 
            style={{ gridTemplateColumns: '140px repeat(6, 1fr)' }}
          >
            {/* Coluna de horários (largura fixa) */}
            <div className={timeCellStyles}>
              {time}
            </div>
            
            {/* Colunas dos dias da semana */}
            {weekDays.map((day) => {
              const dateString = format(day, 'yyyy-MM-dd');
              const slotAppointments = getAppointmentsForSlot(appointments, day, time);
              const appointment = slotAppointments[0];
              const isPast = isPastTimeSlot(day, time);
              const isBlocked = isSlotBlocked(dateString, time);
              const isFirstSlot = appointment && isFirstSlotOfAppointment(time, appointment);
              const slotKey = `${dateString}-${time}`;

              return (
                <div 
                  key={slotKey} 
                  className={slotCellStyles}
                  onClick={(e) => e.stopPropagation()} // Evita fechar ações ao clicar no slot
                >
                  <TimeSlot
                    dateString={dateString}
                    time={time}
                    appointments={slotAppointments}
                    isBlocked={isBlocked}
                    isPast={isPast}
                    onSlotClick={handleSlotClick}
                    onEditAppointment={onEditAppointment}
                    onDeleteAppointment={onDeleteAppointment}
                    isFirstSlot={isFirstSlot}
                    showAppointmentActions={activeAppointmentSlot === slotKey}
                    onToggleAppointmentActions={() => handleToggleAppointmentActions(slotKey)}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyScheduleGrid;
