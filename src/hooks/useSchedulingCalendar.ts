
/**
 * Hook principal para gerenciamento da agenda de agendamentos
 * 
 * Este hook centraliza toda a lógica de estado e operações da agenda,
 * fornecendo uma interface limpa e consistente para os componentes.
 * 
 * Responsabilidades principais:
 * - Gerenciamento de estado da agenda (profissionais, agendamentos, etc)
 * - Operações CRUD de agendamentos via Supabase
 * - Validações de horários e disponibilidade
 * - Integração com fusos horários (Brasília - UTC-3)
 * - Cache e otimização de consultas
 * - Tratamento de erros e feedback para usuário
 * 
 * Características técnicas:
 * - Usa timezone de Brasília para todos os cálculos de data/hora
 * - Implementa logs detalhados para debug e monitoramento
 * - Otimiza performance com carregamento condicional
 * - Integra com hooks auxiliares para funcionalidades específicas
 * - Garante consistência de dados entre componentes
 * 
 * Fluxo de dados:
 * 1. Carrega profissionais ativos do sistema
 * 2. Quando profissional é selecionado, carrega seus agendamentos
 * 3. Carrega períodos bloqueados e valida disponibilidade
 * 4. Fornece handlers para todas as operações de agendamento
 * 5. Mantém estado sincronizado após mudanças
 */

import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TeamMember, Appointment } from '@/types';
import { useTimeValidation } from '@/hooks/useTimeValidation';
import { useBlockedPeriods } from '@/hooks/useBlockedPeriods';
import { getBrasiliaDate, formatBrasiliaDate, isValidTimeString } from '@/utils/timezoneUtils';
import { getAppointmentsForSlot, sanitizeTimeString } from '@/utils/scheduleCalculations';

/**
 * Hook personalizado para gerenciamento completo da agenda
 * 
 * @returns {Object} Objeto contendo estados e funções da agenda
 */
export const useSchedulingCalendar = () => {
  
  // === ESTADOS PRINCIPAIS ===
  
  /**
   * Lista de profissionais ativos no sistema
   * Carregada uma vez na inicialização e usada para seleção
   */
  const [professionals, setProfessionals] = useState<TeamMember[]>([]);
  
  /**
   * ID do profissional atualmente selecionado
   * Controla qual agenda está sendo visualizada
   */
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  
  /**
   * Data da semana atual sendo exibida na agenda
   * Usa timezone de Brasília para garantir consistência
   */
  const [currentWeek, setCurrentWeek] = useState(getBrasiliaDate());
  
  /**
   * Data selecionada (usado principalmente em mobile)
   * Mantém sincronia com a visualização de agenda
   */
  const [selectedDate, setSelectedDate] = useState(getBrasiliaDate());
  
  /**
   * Lista de agendamentos do profissional selecionado para a semana atual
   * Inclui dados relacionados (cliente, serviços) formatados para exibição
   */
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  /**
   * Controla visibilidade do formulário de criação de agendamento
   */
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  
  /**
   * Dados do slot selecionado para criação de agendamento
   * Inclui data, horário e profissional
   */
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
    professionalId: string;
  } | null>(null);
  
  /**
   * Estado de carregamento para operações assíncronas
   */
  const [loading, setLoading] = useState(false);

  // === HOOKS AUXILIARES ===
  
  /**
   * Hook para exibição de notificações ao usuário
   */
  const { toast } = useToast();
  
  /**
   * Hook para validação de horários e regras de negócio
   */
  const { validateSlotClick } = useTimeValidation();

  // === CÁLCULOS DE PERÍODO ===
  
  /**
   * Cálculo do início e fim da semana atual
   * Considera domingo como primeiro dia da semana (padrão brasileiro)
   * Usa timezone de Brasília para garantir consistência
   */
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Domingo
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 }); // Sábado
  
  /**
   * Hook para gerenciamento de períodos bloqueados
   * Carrega e valida bloqueios para o profissional e período selecionados
   */
  const { isSlotBlocked, fetchBlockedPeriods } = useBlockedPeriods(
    selectedProfessional, 
    weekStart, 
    weekEnd
  );

  // === EFEITOS DE CARREGAMENTO ===
  
  /**
   * Carrega profissionais quando o componente monta
   * Executa apenas uma vez na inicialização
   */
  useEffect(() => {
    fetchProfessionals();
  }, []);

  /**
   * Carrega agendamentos quando profissional ou semana muda
   * Limpa agendamentos quando nenhum profissional está selecionado
   */
  useEffect(() => {
    if (selectedProfessional) {
      fetchAppointments();
    } else {
      console.log('⚠️ Limpando agendamentos - nenhum profissional selecionado');
      setAppointments([]);
    }
  }, [selectedProfessional, currentWeek]);

  // === FUNÇÕES DE CARREGAMENTO DE DADOS ===
  
  /**
   * Busca todos os profissionais ativos do sistema
   * 
   * Operações realizadas:
   * 1. Consulta tabela 'users' filtrando por 'has_access = true'
   * 2. Ordena por nome para melhor experiência do usuário
   * 3. Mapeia dados do Supabase para tipo TeamMember
   * 4. Atualiza estado e exibe logs de debug
   * 5. Trata erros com notificação ao usuário
   * 
   * @async
   * @function fetchProfessionals
   */
  const fetchProfessionals = async () => {
    try {
      console.log('🔍 Buscando profissionais ativos...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('has_access', true)
        .order('name');

      if (error) throw error;

      // Mapeamento de dados do banco para o tipo TeamMember
      const teamMembers: TeamMember[] = data.map(user => ({
        id: user.id,
        name: user.name,
        profession: user.profession || '',
        phone: user.phone || '',
        email: user.email,
        password: '', // Não carregamos senhas por segurança
        hasAccess: user.has_access,
        isManager: user.is_manager,
        avatar: user.avatar || '',
        categories: user.categories || []
      }));

      setProfessionals(teamMembers);
      console.log(`✅ ${teamMembers.length} profissionais carregados`);
      
    } catch (error) {
      console.error('❌ Erro ao buscar profissionais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os profissionais.",
        variant: "destructive",
      });
    }
  };

  /**
   * Busca agendamentos do profissional selecionado para a semana atual
   * 
   * Operações realizadas:
   * 1. Valida se há profissional selecionado
   * 2. Consulta agendamentos do período com dados relacionados (cliente)
   * 3. Busca serviços associados aos agendamentos encontrados
   * 4. Monta mapa de serviços para acesso eficiente
   * 5. Formata dados para exibição na interface
   * 6. Atualiza estado com logs detalhados de debug
   * 7. Trata erros preservando experiência do usuário
   * 
   * Detalhes técnicos:
   * - Usa JOIN para carregar dados do cliente em uma consulta
   * - Faz consulta separada para serviços (limitação do Supabase)
   * - Aplica fallbacks para campos opcionais
   * - Sanitiza horários para formato de exibição
   * - Logs detalhados para debug e monitoramento
   * 
   * @async
   * @function fetchAppointments
   */
  const fetchAppointments = async () => {
    if (!selectedProfessional) {
      console.log('⚠️ Nenhum profissional selecionado, cancelando busca de agendamentos');
      return;
    }

    setLoading(true);
    try {
      const startDateStr = format(weekStart, 'yyyy-MM-dd');
      const endDateStr = format(weekEnd, 'yyyy-MM-dd');
      
      console.log('=== 🔍 INICIANDO BUSCA DE AGENDAMENTOS ===');
      console.log('👤 Professional ID:', selectedProfessional);
      console.log('📅 Período:', startDateStr, 'até', endDateStr);
      console.log('🌎 Timezone usado: America/Sao_Paulo (UTC-3)');

      // Consulta principal: agendamentos com dados do cliente
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (
            id,
            name
          )
        `)
        .eq('professional_id', selectedProfessional)
        .gte('appointment_date', startDateStr)
        .lte('appointment_date', endDateStr)
        .order('appointment_date')
        .order('start_time');

      if (appointmentsError) {
        console.error('❌ Erro ao buscar agendamentos:', appointmentsError);
        throw appointmentsError;
      }

      console.log(`📋 ${appointmentsData?.length || 0} agendamentos encontrados no banco`);

      if (!appointmentsData || appointmentsData.length === 0) {
        console.log('ℹ️ Nenhum agendamento encontrado para o período');
        setAppointments([]);
        return;
      }

      // Consulta secundária: serviços dos agendamentos
      const appointmentIds = appointmentsData.map(app => app.id);
      console.log('🔍 Buscando serviços para agendamentos:', appointmentIds);

      const { data: appointmentServicesData, error: servicesError } = await supabase
        .from('appointment_services')
        .select(`
          appointment_id,
          services (
            id,
            name
          )
        `)
        .in('appointment_id', appointmentIds);

      if (servicesError) {
        console.error('❌ Erro ao buscar serviços:', servicesError);
        // Continuamos sem os serviços em caso de erro
      }

      // Criação do mapa de serviços para acesso eficiente
      const servicesMap = new Map();
      appointmentServicesData?.forEach(item => {
        if (!servicesMap.has(item.appointment_id)) {
          servicesMap.set(item.appointment_id, []);
        }
        if (item.services) {
          servicesMap.get(item.appointment_id).push(item.services);
        }
      });

      // Processamento e formatação dos agendamentos
      const formattedAppointments: Appointment[] = appointmentsData.map((appointment: any) => {
        const client = appointment.clients;
        const services = servicesMap.get(appointment.id) || [];
        
        console.log('⚙️ Processando agendamento:', {
          id: appointment.id,
          date: appointment.appointment_date,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          client_name: client?.name,
          services: services.map((s: any) => s.name)
        });

        // Concatenação dos nomes dos serviços
        const serviceNames = services
          .map((s: any) => s.name)
          .filter(Boolean)
          .join(', ');

        return {
          id: appointment.id,
          appointment_date: appointment.appointment_date,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          client_id: appointment.client_id,
          professional_id: appointment.professional_id,
          total_duration: appointment.total_duration,
          total_value: appointment.total_value,
          status: appointment.status,
          notes: appointment.notes,
          created_at: appointment.created_at,
          updated_at: appointment.updated_at,
          client_name: client?.name || 'Cliente não identificado',
          service_name: serviceNames || 'Serviço não especificado'
        };
      });

      console.log('=== ✅ AGENDAMENTOS PROCESSADOS ===');
      console.log(`📊 Total processados: ${formattedAppointments.length}`);
      formattedAppointments.forEach(app => {
        console.log(`📝 ${app.client_name} - ${app.service_name} em ${app.appointment_date} das ${app.start_time} às ${app.end_time}`);
      });

      setAppointments(formattedAppointments);

    } catch (error) {
      console.error('❌ Erro geral ao buscar agendamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos.",
        variant: "destructive",
      });
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // === HANDLERS DE INTERAÇÃO ===
  
  /**
   * Manipula o clique em um slot da agenda
   * 
   * Fluxo de validações:
   * 1. Verifica se há profissional selecionado
   * 2. Valida formato do horário
   * 3. Verifica se slot está bloqueado
 * 4. Verifica se slot está ocupado
   * 5. Valida se horário não está no passado
   * 6. Abre formulário de agendamento se válido
   * 
   * Logs detalhados:
   * - Estado inicial da validação
   * - Resultados de cada verificação
   * - Razão de falha quando aplicável
   * - Sucesso e abertura do formulário
   * 
   * @param {string} date - Data do slot clicado (YYYY-MM-DD)
   * @param {string} time - Horário do slot clicado (HH:MM)
   */
  const handleSlotClick = (date: string, time: string) => {
    console.log('=== 🖱️ CLIQUE NO SLOT ===');
    console.log('📅 Data:', date, '🕐 Hora:', time);
    console.log('🔍 Total de agendamentos carregados:', appointments.length);

    // Validação: profissional selecionado
    if (!selectedProfessional) {
      toast({
        title: "Atenção",
        description: "Selecione um profissional primeiro.",
        variant: "destructive",
      });
      return;
    }

    // Validação: formato do horário
    if (!isValidTimeString(time)) {
      toast({
        title: "Erro",
        description: "Horário inválido.",
        variant: "destructive",
      });
      return;
    }

    // Validação: slot bloqueado
    if (isSlotBlocked(date, time)) {
      console.log('🚫 Slot bloqueado');
      toast({
        title: "Horário bloqueado",
        description: "Este horário está bloqueado para agendamentos.",
        variant: "destructive",
      });
      return;
    }

    // Validação: slot ocupado
    const slotDate = new Date(date + 'T00:00:00');
    const occupyingAppointments = getAppointmentsForSlot(appointments, slotDate, time);
    
    console.log('📋 Verificação de ocupação:', {
      slotDate: date,
      slotTime: time,
      appointmentsFound: occupyingAppointments.length,
      appointments: occupyingAppointments.map(app => ({
        id: app.id,
        client: app.client_name,
        start: app.start_time,
        end: app.end_time
      }))
    });

    if (occupyingAppointments.length > 0) {
      const appointment = occupyingAppointments[0];
      toast({
        title: "Horário ocupado",
        description: `Este horário já está agendado para ${appointment.client_name} (${sanitizeTimeString(appointment.start_time)}-${sanitizeTimeString(appointment.end_time)}).`,
        variant: "destructive",
      });
      return;
    }

    // Validação: horário no passado
    const validation = validateSlotClick(date, time);
    
    if (!validation.isValid) {
      console.log('⏰ Validação de horário falhou:', validation.message);
      toast({
        title: "Atenção",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Slot válido, abrindo formulário de agendamento');

    // Abertura do formulário para slot válido
    setSelectedSlot({
      date,
      time,
      professionalId: selectedProfessional
    });
    setIsAppointmentFormOpen(true);
  };

  /**
   * Callback executado após criação/edição/exclusão de agendamento
   * 
   * Operações realizadas:
   * 1. Recarrega lista de agendamentos
   * 2. Atualiza períodos bloqueados
   * 3. Fecha formulários abertos
   * 4. Limpa estados temporários
   * 5. Log da operação de recarga
   */
  const handleAppointmentCreated = () => {
    console.log('♻️ Recarregando dados após modificação de agendamento');
    fetchAppointments();
    fetchBlockedPeriods();
    setIsAppointmentFormOpen(false);
    setSelectedSlot(null);
  };

  /**
   * Fecha o formulário de agendamento e limpa estados
   */
  const closeAppointmentForm = () => {
    setIsAppointmentFormOpen(false);
    setSelectedSlot(null);
  };

  // === DADOS DERIVADOS ===
  
  /**
   * Busca dados completos do profissional selecionado
   * Usado para exibir informações na interface
   */
  const selectedProfessionalData = professionals.find(p => p.id === selectedProfessional);

  // === RETORNO DO HOOK ===
  
  return {
    // Estados principais
    professionals,
    selectedProfessional,
    setSelectedProfessional,
    currentWeek,
    setCurrentWeek,
    selectedDate,
    setSelectedDate,
    appointments,
    isAppointmentFormOpen,
    selectedSlot,
    loading,
    selectedProfessionalData,
    
    // Funções de interação
    handleSlotClick,
    handleAppointmentCreated,
    closeAppointmentForm,
    isSlotBlocked
  };
};
