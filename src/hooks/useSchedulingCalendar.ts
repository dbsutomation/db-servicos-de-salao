
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

      console.log('Fetching appointments for:', {
        professional: selectedProfessional,
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd')
      });

      // Buscar agendamentos simples primeiro
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          clients!inner(name)
        `)
        .eq('professional_id', selectedProfessional)
        .gte('appointment_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('appointment_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('appointment_date')
        .order('start_time');

      if (appointmentsError) {
        console.error('Erro na consulta de agendamentos:', appointmentsError);
        throw appointmentsError;
      }

      console.log('Raw appointments data:', appointmentsData);

      if (!appointmentsData || appointmentsData.length === 0) {
        console.log('Nenhum agendamento encontrado');
        setAppointments([]);
        setLoading(false);
        return;
      }

      // Buscar serviços separadamente para cada agendamento
      const appointmentsWithServices = await Promise.all(
        appointmentsData.map(async (appointment) => {
          const { data: servicesData, error: servicesError } = await supabase
            .from('appointment_services')
            .select(`
              service_id,
              quantity,
              unit_price,
              services!inner(name, price)
            `)
            .eq('appointment_id', appointment.id);

          if (servicesError) {
            console.error('Erro ao buscar serviços:', servicesError);
            return {
              ...appointment,
              client_name: appointment.clients?.name || 'Cliente não especificado',
              service_name: 'Serviço não especificado'
            };
          }

          // Concatenar nomes dos serviços se houver múltiplos
          const serviceNames = servicesData?.map(s => s.services?.name).filter(Boolean) || [];
          const serviceName = serviceNames.length > 0 ? serviceNames.join(', ') : 'Serviço não especificado';

          console.log('Services for appointment', appointment.id, ':', serviceNames);

          return {
            ...appointment,
            client_name: appointment.clients?.name || 'Cliente não especificado',
            service_name: serviceName
          };
        })
      );

      console.log('Final appointments with services:', appointmentsWithServices);
      setAppointments(appointmentsWithServices);

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
      const appointmentDate = new Date(appointment.appointment_date);
      const appointmentStartTime = appointment.start_time.substring(0, 5);
      const appointmentEndTime = appointment.end_time.substring(0, 5);
      
      return format(appointmentDate, 'yyyy-MM-dd') === date && 
             time >= appointmentStartTime && 
             time < appointmentEndTime;
    });

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
