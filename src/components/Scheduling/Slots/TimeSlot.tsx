
import React, { memo, useCallback } from 'react';
import { Appointment } from '@/types';
import { AppointmentSlot } from './AppointmentSlot';

/**
 * Interface para as propriedades do componente TimeSlot
 * 
 * @interface TimeSlotProps
 * @property {string} dateString - Data do slot no formato YYYY-MM-DD
 * @property {string} time - Horário do slot no formato HH:MM
 * @property {Appointment[]} appointments - Lista de agendamentos que ocupam este slot
 * @property {boolean} isBlocked - Indica se o slot está bloqueado para agendamentos
 * @property {boolean} isPast - Indica se o slot representa um horário passado
 * @property {Function} onSlotClick - Callback executado quando slot vazio é clicado
 * @property {Function} onEditAppointment - Callback para editar agendamento existente
 * @property {Function} onDeleteAppointment - Callback para excluir agendamento existente
 * @property {boolean} isFirstSlot - Indica se é a primeira linha de um agendamento multi-slot
 * @property {boolean} showAppointmentActions - Controla visibilidade das ações do agendamento
 * @property {Function} onToggleAppointmentActions - Callback para alternar ações do agendamento
 */
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
 * Este componente é o núcleo da lógica de renderização de slots na agenda.
 * Ele determina o tipo de conteúdo a ser exibido baseado no estado do slot:
 * 
 * Tipos de renderização:
 * 1. **Agendamento completo** - Primeira linha de um agendamento com todas as informações
 * 2. **Continuação de agendamento** - Linhas subsequentes de agendamentos longos
 * 3. **Slot disponível** - Horário livre que pode receber novos agendamentos
 * 4. **Slot bloqueado** - Horário indisponível por bloqueio manual
 * 5. **Slot passado** - Horário que já passou (não pode ser agendado)
 * 
 * Lógica de decisão:
 * - Verifica primeiro se há agendamentos ocupando o slot
 * - Se há agendamento, determina se é primeira linha ou continuação
 * - Se não há agendamento, determina se está bloqueado, passou ou disponível
 * 
 * Estados visuais:
 * - **Agendamento**: Fundo azul claro com borda azul e informações completas
 * - **Continuação**: Fundo azul claro simples sem informações
 * - **Bloqueado**: Fundo laranja com indicador visual e cursor não permitido
 * - **Passado**: Fundo cinza com texto esmaecido e cursor não permitido
 * - **Disponível**: Fundo neutro com hover azul e cursor pointer
 * 
 * Acessibilidade:
 * - Labels ARIA específicas para cada tipo de slot
 * - Suporte completo a navegação por teclado
 * - Indicadores visuais claros para usuários com deficiências visuais
 * 
 * Performance:
 * - Componente memoizado para evitar re-renders desnecessários
 * - Callbacks otimizados para prevenir criação de funções desnecessárias
 * - Renderização condicional eficiente
 * 
 * @param {TimeSlotProps} props - Propriedades do componente
 * @returns {JSX.Element} Slot de tempo renderizado conforme seu estado
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
  
  // === ANÁLISE DO ESTADO DO SLOT ===
  
  /**
   * Agendamento principal que ocupa este slot
   * Como um slot pode teoricamente ter múltiplos agendamentos,
   * sempre pegamos o primeiro da lista para renderização
   */
  const appointment = appointments[0];
  
  /**
   * Indica se o slot está ocupado por algum agendamento
   * Usado para determinar o tipo de renderização necessária
   */
  const isOccupied = appointments.length > 0;

  // === HANDLERS DE EVENTOS ===
  
  /**
   * Manipula clique em slot vazio/disponível
   * 
   * Responsabilidades:
   * - Verificar se o slot pode receber novos agendamentos
   * - Prevenir ação se slot estiver bloqueado ou no passado
   * - Executar callback de criação de agendamento quando válido
   * 
   * Validações aplicadas:
   * - Slot não pode estar bloqueado
   * - Slot não pode representar horário passado
   * - Slot deve estar vazio (sem agendamentos)
   */
  const handleSlotClick = useCallback(() => {
    if (!isBlocked && !isPast) {
      onSlotClick(dateString, time);
    }
  }, [dateString, time, isBlocked, isPast, onSlotClick]);

  // === RENDERIZAÇÃO CONDICIONAL ===
  
  /**
   * CASO 1: Slot de agendamento completo (primeira linha)
   * 
   * Renderiza quando:
   * - Há agendamento ocupando o slot
   * - É a primeira linha deste agendamento (pode ser multi-linha)
   * - Agendamento existe e é válido
   * 
   * Delegação: Passa renderização para AppointmentSlot especializado
   */
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

  /**
   * CASO 2: Continuação do agendamento (linhas subsequentes)
   * 
   * Renderiza quando:
   * - Há agendamento ocupando o slot
   * - NÃO é a primeira linha deste agendamento
   * 
   * Visual: Fundo azul simples sem informações para indicar continuação
   */
  if (isOccupied && !isFirstSlot) {
    return (
      <div 
        className="bg-blue-50 h-full px-4 py-3"
        aria-label="Continuação do agendamento"
      />
    );
  }

  // === FUNÇÃO UTILITÁRIA PARA ESTILOS ===
  
  /**
   * Determina as classes CSS baseadas no status do slot vazio
   * 
   * Prioridade de estados:
   * 1. Bloqueado - laranja, cursor não permitido, indicador visual
   * 2. Passado - cinza, cursor não permitido, texto esmaecido
   * 3. Disponível - neutro, hover azul, cursor pointer, transições
   * 
   * @returns {string} Classes CSS apropriadas para o estado atual
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
   * Gera label de acessibilidade apropriada para o estado do slot
   * 
   * Labels específicas melhoram significativamente a experiência
   * de usuários que dependem de tecnologias assistivas
   * 
   * @returns {string} Texto descritivo para screen readers
   */
  const getAriaLabel = () => {
    if (isBlocked) return `Horário ${time} indisponível`;
    if (isPast) return `Horário ${time} já passou`;
    return `Agendar horário ${time}`;
  };

  /**
   * CASO 3: Slot disponível, bloqueado ou passado
   * 
   * Renderiza quando não há agendamentos ocupando o slot
   * 
   * Comportamentos:
   * - Bloqueado: Mostra indicador visual "Bloqueado"
   * - Passado: Inativo, sem interação
   * - Disponível: Permite clique para criar agendamento
   */
  return (
    <button
      className={`w-full h-full text-xs flex items-center justify-center px-4 py-3 ${getSlotClasses()}`}
      disabled={isBlocked || isPast}
      onClick={handleSlotClick}
      aria-label={getAriaLabel()}
      type="button"
    >
      {/* Indicador visual específico para slots bloqueados */}
      {isBlocked && (
        <span className="text-orange-600 font-medium text-center px-2 py-1 bg-orange-100 rounded text-xs">
          Bloqueado
        </span>
      )}
    </button>
  );
});

// Nome de exibição para ferramentas de debug e desenvolvimento
TimeSlot.displayName = 'TimeSlot';
