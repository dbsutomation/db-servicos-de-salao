
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

      // Buscar agendamentos com dados do cliente e serviços
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          clients!inner(name),
          appointment_services!inner(
            service_id,
            quantity,
            unit_price,
            services!inner(name)
          )
        `)
        .eq('professional_id', selectedProfessional)
        .gte('appointment_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('appointment_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('appointment_date')
        .order('start_time');

      if (appointmentsError) {
        console.error('Erro na consulta:', appointmentsError);
        throw appointmentsError;
      }

      console.log('Appointments data:', appointmentsData);

      // Transformar os dados para incluir client_name e service_name
      const transformedAppointments = appointmentsData?.map(appointment => {
        const serviceName = appointment.appointment_services?.[0]?.services?.name || 'Serviço não especificado';
        
        return {
          ...appointment,
          client_name: appointment.clients?.name || 'Cliente não especificado',
          service_name: serviceName
        };
      }) || [];

      console.log('Transformed appointments:', transformedAppointments);
      setAppointments(transformedAppointments);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos.",
        variant: "destructive",
      });
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
