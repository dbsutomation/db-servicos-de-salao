
import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TeamMember, Appointment } from '@/types';
import { useTimeValidation } from '@/hooks/useTimeValidation';

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
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });

      console.log('=== INICIO BUSCA AGENDAMENTOS ===');
      console.log('Professional ID:', selectedProfessional);
      console.log('Week range:', format(weekStart, 'yyyy-MM-dd'), 'to', format(weekEnd, 'yyyy-MM-dd'));

      // Buscar agendamentos
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('professional_id', selectedProfessional)
        .gte('appointment_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('appointment_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('appointment_date')
        .order('start_time');

      if (appointmentsError) {
        console.error('Erro na consulta de agendamentos:', appointmentsError);
        throw appointmentsError;
      }

      console.log('Agendamentos encontrados:', appointmentsData?.length || 0);
      console.log('Dados dos agendamentos:', appointmentsData);

      if (!appointmentsData || appointmentsData.length === 0) {
        console.log('Nenhum agendamento encontrado para o período');
        setAppointments([]);
        setLoading(false);
        return;
      }

      // Buscar dados dos clientes
      const clientIds = [...new Set(appointmentsData.map(app => app.client_id))];
      console.log('Client IDs para buscar:', clientIds);

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .in('id', clientIds);

      if (clientsError) {
        console.error('Erro ao buscar clientes:', clientsError);
      }

      console.log('Clientes encontrados:', clientsData?.length || 0, clientsData);

      // Processar cada agendamento
      const appointmentsWithDetails = await Promise.all(
        appointmentsData.map(async (appointment) => {
          console.log('Processando agendamento ID:', appointment.id);

          // Encontrar cliente
          const client = clientsData?.find(c => c.id === appointment.client_id);
          console.log('Cliente encontrado:', client?.name || 'Não encontrado');

          // Buscar serviços do agendamento
          const { data: servicesData, error: servicesError } = await supabase
            .from('appointment_services')
            .select(`
              *,
              services (*)
            `)
            .eq('appointment_id', appointment.id);

          if (servicesError) {
            console.error('Erro ao buscar serviços do agendamento:', servicesError);
          }

          console.log('Serviços do agendamento:', servicesData?.length || 0, servicesData);

          // Montar nomes dos serviços
          const serviceNames = servicesData?.map(s => s.services?.name).filter(Boolean) || [];
          const serviceName = serviceNames.length > 0 ? serviceNames.join(', ') : 'Serviço não especificado';

          console.log('Nome final dos serviços:', serviceName);

          const appointmentWithDetails: Appointment = {
            ...appointment,
            client_name: client?.name || 'Cliente não especificado',
            service_name: serviceName
          };

          console.log('Agendamento processado:', appointmentWithDetails);
          return appointmentWithDetails;
        })
      );

      console.log('=== AGENDAMENTOS FINAIS ===');
      console.log('Total de agendamentos processados:', appointmentsWithDetails.length);
      appointmentsWithDetails.forEach(app => {
        console.log(`Agendamento ${app.id}: ${app.client_name} - ${app.service_name} em ${app.appointment_date} às ${app.start_time}`);
      });

      setAppointments(appointmentsWithDetails);

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
    console.log('=== SLOT CLICADO ===');
    console.log('Data:', date, 'Hora:', time);
    console.log('Agendamentos para verificação:', appointments.length);

    if (!selectedProfessional) {
      toast({
        title: "Atenção",
        description: "Selecione um profissional primeiro.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se o slot está ocupado
    const isOccupied = appointments.some(appointment => {
      const appointmentDate = format(new Date(appointment.appointment_date), 'yyyy-MM-dd');
      const appointmentStartTime = appointment.start_time.substring(0, 5);
      const appointmentEndTime = appointment.end_time.substring(0, 5);
      
      const isDateMatch = appointmentDate === date;
      const isTimeOverlap = time >= appointmentStartTime && time < appointmentEndTime;
      
      console.log(`Verificando agendamento ${appointment.id}:`, {
        appointmentDate,
        appointmentStartTime,
        appointmentEndTime,
        clickedDate: date,
        clickedTime: time,
        isDateMatch,
        isTimeOverlap,
        isOccupied: isDateMatch && isTimeOverlap
      });
      
      return isDateMatch && isTimeOverlap;
    });

    console.log('Slot ocupado?', isOccupied);

    if (isOccupied) {
      toast({
        title: "Atenção",
        description: "Este horário já está ocupado. Passe o mouse sobre o agendamento para ver os detalhes.",
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
    closeAppointmentForm
  };
};
