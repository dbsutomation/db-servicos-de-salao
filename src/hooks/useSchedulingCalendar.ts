import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TeamMember, Appointment } from '@/types';
import { useTimeValidation } from '@/hooks/useTimeValidation';
import { useBlockedPeriods } from '@/hooks/useBlockedPeriods';

export const useSchedulingCalendar = () => {
  const [professionals, setProfessionals] = useState<TeamMember[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
    professionalId: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { validateSlotClick } = useTimeValidation();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  
  const { isSlotBlocked, fetchBlockedPeriods } = useBlockedPeriods(
    selectedProfessional, 
    weekStart, 
    weekEnd
  );

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    if (selectedProfessional) {
      fetchAppointments();
    }
  }, [selectedProfessional, currentWeek]);

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('has_access', true)
        .order('name');

      if (error) throw error;

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
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os profissionais.",
        variant: "destructive",
      });
    }
  };

  const fetchAppointments = async () => {
    if (!selectedProfessional) return;

    setLoading(true);
    try {
      console.log('=== INICIANDO BUSCA DE AGENDAMENTOS ===');
      console.log('Professional ID:', selectedProfessional);
      console.log('Período:', format(weekStart, 'yyyy-MM-dd'), 'até', format(weekEnd, 'yyyy-MM-dd'));

      // Primeiro, buscar os agendamentos básicos
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('professional_id', selectedProfessional)
        .gte('appointment_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('appointment_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('appointment_date')
        .order('start_time');

      if (appointmentsError) {
        console.error('Erro ao buscar agendamentos:', appointmentsError);
        throw appointmentsError;
      }

      console.log('Agendamentos encontrados:', appointmentsData?.length || 0);

      if (!appointmentsData || appointmentsData.length === 0) {
        console.log('Nenhum agendamento encontrado para o período');
        setAppointments([]);
        return;
      }

      // Buscar dados dos clientes para os agendamentos encontrados
      const clientIds = [...new Set(appointmentsData.map(app => app.client_id))];
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds);

      if (clientsError) {
        console.error('Erro ao buscar clientes:', clientsError);
        throw clientsError;
      }

      // Buscar serviços para os agendamentos
      const appointmentIds = appointmentsData.map(app => app.id);
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
        console.error('Erro ao buscar serviços:', servicesError);
        throw servicesError;
      }

      // Criar map de clientes para acesso rápido
      const clientsMap = new Map(clientsData?.map(client => [client.id, client]) || []);
      
      // Criar map de serviços por agendamento
      const servicesMap = new Map();
      appointmentServicesData?.forEach(item => {
        if (!servicesMap.has(item.appointment_id)) {
          servicesMap.set(item.appointment_id, []);
        }
        if (item.services) {
          servicesMap.get(item.appointment_id).push(item.services);
        }
      });

      // Processar e formatar os dados
      const formattedAppointments: Appointment[] = appointmentsData.map((appointment: any) => {
        const client = clientsMap.get(appointment.client_id);
        const services = servicesMap.get(appointment.id) || [];
        
        console.log('Processando agendamento:', {
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

      console.log('=== AGENDAMENTOS PROCESSADOS ===');
      console.log('Total processados:', formattedAppointments.length);
      formattedAppointments.forEach(app => {
        console.log(`${app.client_name} - ${app.service_name} em ${app.appointment_date} das ${app.start_time} às ${app.end_time}`);
      });

      setAppointments(formattedAppointments);

    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
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

  const handleSlotClick = (date: string, time: string) => {
    console.log('=== CLIQUE NO SLOT ===');
    console.log('Data:', date, 'Hora:', time);
    console.log('Agendamentos para verificar:', appointments.length);

    if (!selectedProfessional) {
      toast({
        title: "Atenção",
        description: "Selecione um profissional primeiro.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se o slot está bloqueado
    if (isSlotBlocked(date, time)) {
      toast({
        title: "Horário bloqueado",
        description: "Este horário está bloqueado para agendamentos.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se o slot está ocupado
    const isOccupied = appointments.some(appointment => {
      const appointmentDate = appointment.appointment_date;
      const appointmentStartTime = appointment.start_time.substring(0, 5);
      const appointmentEndTime = appointment.end_time.substring(0, 5);
      
      const isDateMatch = appointmentDate === date;
      const isTimeInRange = time >= appointmentStartTime && time < appointmentEndTime;
      
      console.log(`Verificando agendamento:`, {
        appointmentDate,
        appointmentStartTime,
        appointmentEndTime,
        clickedDate: date,
        clickedTime: time,
        isDateMatch,
        isTimeInRange,
        resultado: isDateMatch && isTimeInRange
      });
      
      return isDateMatch && isTimeInRange;
    });

    console.log('Slot ocupado?', isOccupied);

    if (isOccupied) {
      toast({
        title: "Horário ocupado",
        description: "Este horário já está agendado. Passe o mouse sobre o agendamento para ver os detalhes.",
        variant: "destructive",
      });
      return;
    }

    const validation = validateSlotClick(date, time);
    
    if (!validation.isValid) {
      toast({
        title: "Atenção",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    setSelectedSlot({
      date,
      time,
      professionalId: selectedProfessional
    });
    setIsAppointmentFormOpen(true);
  };

  const handleAppointmentCreated = () => {
    fetchAppointments();
    fetchBlockedPeriods();
    setIsAppointmentFormOpen(false);
    setSelectedSlot(null);
  };

  const closeAppointmentForm = () => {
    setIsAppointmentFormOpen(false);
    setSelectedSlot(null);
  };

  const selectedProfessionalData = professionals.find(p => p.id === selectedProfessional);

  return {
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
    handleSlotClick,
    handleAppointmentCreated,
    closeAppointmentForm,
    isSlotBlocked
  };
};
