
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

/**
 * Interface para as propriedades do componente WeeklyScheduleGrid
 * 
 * @interface WeeklyScheduleGridProps
 * @property {Date} currentWeek - Data da semana atual sendo exibida
 * @property {Appointment[]} appointments - Lista de agendamentos para renderizar
 * @property {Function} onSlotClick - Callback executado quando um slot é clicado
 * @property {Function} onEditAppointment - Callback para iniciar edição de agendamento
 * @property {Function} onDeleteAppointment - Callback para iniciar exclusão de agendamento
 * @property {boolean} loading - Estado de carregamento da aplicação
 * @property {Function} isSlotBlocked - Função para verificar se um slot está bloqueado
 */
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
 * Este componente é responsável por renderizar uma visualização em grade dos horários 
 * disponíveis para agendamento durante uma semana (segunda a sábado). Principais funcionalidades:
 * 
 * - Renderização responsiva da grade de horários
 * - Visualização de agendamentos existentes com informações completas
 * - Interação para criar novos agendamentos em slots livres
 * - Ações de edição e exclusão de agendamentos existentes
 * - Indicação visual de slots bloqueados ou indisponíveis
 * - Otimização de performance com memoização de cálculos pesados
 * 
 * Arquitetura:
 * - Usa CSS Grid para layout preciso e alinhamento perfeito
 * - Implementa memoização para evitar recálculos desnecessários
 * - Gerencia estado local para controle de ações de agendamentos
 * - Delega renderização de slots individuais para componente TimeSlot
 * 
 * @param {WeeklyScheduleGridProps} props - Propriedades do componente
 * @returns {JSX.Element} Componente da grade semanal renderizado
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
  // === ESTADOS LOCAIS ===
  
  /**
   * Estado para controlar qual agendamento está com ações visíveis
   * Usado principalmente em dispositivos móveis para mostrar/ocultar
   * botões de editar e excluir de forma controlada
   */
  const [activeAppointmentSlot, setActiveAppointmentSlot] = useState<string | null>(null);

  // === CÁLCULOS MEMOIZADOS ===
  
  /**
   * Memoização dos cálculos estáticos para otimização de performance
   * 
   * Calcula apenas uma vez por mudança de semana:
   * - weekDays: Array com os 6 dias da semana (segunda a sábado)
   * - mainHours: Array com os horários de trabalho (apenas horários inteiros: 09:00, 10:00, etc)
   * 
   * Esta memoização é crucial para performance pois evita recálculos
   * desnecessários durante re-renders causados por outros estados
   */
  const { weekDays, mainHours } = useMemo(() => {
    // Calcula o início da semana considerando domingo como dia 0
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
    
    // Gera array com 6 dias consecutivos (segunda-feira a sábado)
    // Pula o domingo (índice 0) começando do índice 1
    const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i + 1));
    
    return {
      weekDays: days,
      mainHours: generateMainHours() // Função utilitária que gera horários inteiros
    };
  }, [currentWeek]);

  // === HANDLERS DE EVENTOS ===
  
  /**
   * Alterna a visibilidade das ações de um agendamento específico
   * 
   * Este handler é usado principalmente em dispositivos móveis onde
   * as ações de editar/excluir não são visíveis no hover. Permite
   * mostrar/ocultar as ações de forma controlada.
   * 
   * @param {string} slotKey - Identificador único do slot (formato: YYYY-MM-DD-HH:MM)
   */
  const handleToggleAppointmentActions = useCallback((slotKey: string) => {
    setActiveAppointmentSlot(prev => prev === slotKey ? null : slotKey);
  }, []);

  /**
   * Manipula o clique em um slot da grade
   * 
   * Responsável por:
   * - Fechar qualquer ação de agendamento que esteja aberta
   * - Executar o callback de clique no slot passado pelo componente pai
   * 
   * @param {string} date - Data do slot clicado (formato: YYYY-MM-DD)
   * @param {string} time - Horário do slot clicado (formato: HH:MM)
   */
  const handleSlotClick = useCallback((date: string, time: string) => {
    setActiveAppointmentSlot(null);
    onSlotClick(date, time);
  }, [onSlotClick]);

  /**
   * Manipula cliques gerais na grade para fechar ações abertas
   * 
   * Este handler garante que ações de agendamentos fichem fechadas
   * quando o usuário clica em qualquer lugar da grade, melhorando
   * a experiência do usuário
   */
  const handleGridClick = useCallback(() => {
    setActiveAppointmentSlot(null);
  }, []);

  // === RENDERIZAÇÃO CONDICIONAL ===
  
  /**
   * Renderiza estado de carregamento
   * 
   * Exibe um spinner centralizado com indicadores de acessibilidade
   * apropriados enquanto os dados estão sendo carregados
   */
  if (loading) {
    return (
      <div 
        className="flex items-center justify-center h-64 bg-white" 
        role="status" 
        aria-live="polite"
      >
        <Loader2 
          className="h-8 w-8 animate-spin text-blue-600" 
          aria-label="Carregando agenda" 
        />
        <span className="sr-only">Carregando agenda...</span>
      </div>
    );
  }

  // === ESTILOS CONSISTENTES ===
  
  /**
   * Classes CSS consistentes para todas as células da grade
   * 
   * Estas constantes garantem alinhamento perfeito entre header e corpo
   * da grade, além de facilitar manutenção futura dos estilos
   */
  const cellStyles = 'px-4 py-3';
  const timeCellStyles = `${cellStyles} text-sm font-medium text-gray-600 border-r border-gray-100 bg-gray-50 flex items-center justify-center`;
  const dayCellStyles = `${cellStyles} text-center border-r border-gray-200 last:border-r-0 min-h-[70px] flex flex-col justify-center bg-gray-50`;
  const slotCellStyles = 'border-r border-gray-100 last:border-r-0 min-h-[60px] hover:bg-blue-25 transition-colors relative';

  // === RENDERIZAÇÃO PRINCIPAL ===
  
  return (
    <div 
      className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100" 
      onClick={handleGridClick}
    >
      {/* === HEADER DA GRADE === */}
      <div 
        className="grid bg-gray-50 border-b border-gray-200" 
        style={{ gridTemplateColumns: '140px repeat(6, 1fr)' }}
      >
        {/* Célula do cabeçalho "Horário" - coluna fixa */}
        <div className={`${cellStyles} text-sm font-semibold text-gray-700 border-r border-gray-200 flex items-center justify-center min-h-[70px] bg-white`}>
          Horário
        </div>
        
        {/* Células dos dias da semana - colunas flexíveis */}
        {weekDays.map((day) => (
          <div key={day.toISOString()} className={dayCellStyles}>
            {/* Nome do dia da semana em maiúsculas */}
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
              {format(day, 'EEEE', { locale: ptBR })}
            </div>
            {/* Número do dia em destaque */}
            <div className="text-lg font-bold text-gray-900">
              {format(day, 'd')}
            </div>
            {/* Data formatada para referência */}
            <div className="text-xs text-gray-500 mt-1">
              {format(day, 'dd/MM', { locale: ptBR })}
            </div>
          </div>
        ))}
      </div>

      {/* === CORPO DA GRADE COM SCROLL === */}
      <div className="max-h-[500px] overflow-y-auto">
        {mainHours.map((time) => (
          <div 
            key={time} 
            className="grid border-b border-gray-100 last:border-b-0 min-h-[70px] hover:bg-gray-25 transition-colors" 
            style={{ gridTemplateColumns: '140px repeat(6, 1fr)' }}
          >
            {/* === COLUNA DE HORÁRIOS === */}
            <div className={timeCellStyles}>
              {time}
            </div>
            
            {/* === COLUNAS DOS DIAS === */}
            {weekDays.map((day) => {
              // Formatação e cálculos para cada slot individual
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
                  {/* Delegação da renderização do slot para componente especializado */}
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
