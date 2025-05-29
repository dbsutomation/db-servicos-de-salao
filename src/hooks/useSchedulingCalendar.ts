
/**
 * Hook principal para gerenciamento da agenda
 * 
 * Centraliza toda a lógica de estado e operações da agenda,
 * garantindo que todas as operações considerem o fuso horário
 * de Brasília e tenham logs detalhados para debug
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

export const useSchedulingCalendar = () => {
  // Estados principais da agenda
  const [professionals, setProfessionals] = useState<TeamMember[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState(getBrasiliaDate()); // Usa data de Brasília
  const [selectedDate, setSelectedDate] = useState(getBrasiliaDate()); // Usa data de Brasília
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
    professionalId: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Hooks auxiliares
  const { toast } = useToast();
  const { validateSlotClick } = useTimeValidation();

  // Calcula início e fim da semana considerando o fuso horário de Brasília
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Domingo
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 }); // Sábado
  
  // Hook para períodos bloqueados
  const { isSlotBlocked, fetchBlockedPeriods } = useBlockedPeriods(
    selectedProfessional, 
    weekStart, 
    weekEnd
  );

  // Busca profissionais quando o componente monta
  useEffect(() => {
    fetchProfessionals();
  }, []);

  // Busca agendamentos quando profissional ou semana muda
  useEffect(() => {
    if (selectedProfessional) {
      fetchAppointments();
    } else {
      console.log('⚠️ Limpando agendamentos - nenhum profissional selecionado');
      setAppointments([]); // Limpa agendamentos quando não há profissional selecionado
    }
  }, [selectedProfessional, currentWeek]);

  /**
   * Busca todos os profissionais ativos do sistema
   * Mapeia os dados do Supabase para o formato esperado pelo frontend
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

      // Mapeia dados do banco para o tipo TeamMember
      const teamMembers: TeamMember[] = data.map(user => ({
        id: user.id,
        name: user.name,
        profession: user.profession || '',
        phone: user.phone || '',
        email: user.email,
        password: '',
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
   * Inclui dados relacionados (cliente, serviços) e formata para exibição
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

      // Busca agendamentos básicos com join dos dados do cliente
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

      // Busca serviços dos agendamentos
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
        // Não vamos falhar por causa dos serviços, continuamos sem eles
      }

      // Cria mapa para acesso rápido aos serviços
      const servicesMap = new Map();
      appointmentServicesData?.forEach(item => {
        if (!servicesMap.has(item.appointment_id)) {
          servicesMap.set(item.appointment_id, []);
        }
        if (item.services) {
          servicesMap.get(item.appointment_id).push(item.services);
        }
      });

      // Processa e formata os agendamentos
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

  /**
   * Manipula o clique em um slot da agenda
   * Valida disponibilidade, bloqueios e horários passados
   * 
   * @param date - Data do slot clicado (YYYY-MM-DD)
   * @param time - Horário do slot clicado (HH:MM)
   */
  const handleSlotClick = (date: string, time: string) => {
    console.log('=== 🖱️ CLIQUE NO SLOT ===');
    console.log('📅 Data:', date, '🕐 Hora:', time);
    console.log('🔍 Total de agendamentos carregados:', appointments.length);

    // Validações básicas
    if (!selectedProfessional) {
      toast({
        title: "Atenção",
        description: "Selecione um profissional primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidTimeString(time)) {
      toast({
        title: "Erro",
        description: "Horário inválido.",
        variant: "destructive",
      });
      return;
    }

    // Verifica se o slot está bloqueado
    if (isSlotBlocked(date, time)) {
      console.log('🚫 Slot bloqueado');
      toast({
        title: "Horário bloqueado",
        description: "Este horário está bloqueado para agendamentos.",
        variant: "destructive",
      });
      return;
    }

    // Verifica se o slot está ocupado usando função corrigida
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

    // Valida se o horário não está no passado
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

    // Se chegou até aqui, o slot é válido
    setSelectedSlot({
      date,
      time,
      professionalId: selectedProfessional
    });
    setIsAppointmentFormOpen(true);
  };

  /**
   * Callback executado após criação/edição/exclusão de agendamento
   * Recarrega os dados e fecha formulários
   */
  const handleAppointmentCreated = () => {
    console.log('♻️ Recarregando dados após modificação de agendamento');
    fetchAppointments();
    fetchBlockedPeriods();
    setIsAppointmentFormOpen(false);
    setSelectedSlot(null);
  };

  /**
   * Fecha o formulário de agendamento
   */
  const closeAppointmentForm = () => {
    setIsAppointmentFormOpen(false);
    setSelectedSlot(null);
  };

  // Busca dados do profissional selecionado
  const selectedProfessionalData = professionals.find(p => p.id === selectedProfessional);

  return {
    // Estados
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
    
    // Funções
    handleSlotClick,
    handleAppointmentCreated,
    closeAppointmentForm,
    isSlotBlocked
  };
};
