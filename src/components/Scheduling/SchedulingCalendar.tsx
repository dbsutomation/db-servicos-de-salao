import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TeamMember, Appointment } from '@/types';
import WeeklyScheduleGrid from './WeeklyScheduleGrid';
import AppointmentFormDialog from './AppointmentFormDialog';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SchedulingCalendar = () => {
  const [professionals, setProfessionals] = useState<TeamMember[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
    professionalId: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
        avatar: user.avatar || ''
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

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('professional_id', selectedProfessional)
        .gte('appointment_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('appointment_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('appointment_date')
        .order('start_time');

      if (error) throw error;

      setAppointments(data || []);
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

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast({
        title: "Atenção",
        description: "Não é possível agendar em datas passadas.",
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

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => 
      direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1)
    );
  };

  const selectedProfessionalData = professionals.find(p => p.id === selectedProfessional);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seleção do Profissional</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um profissional" />
            </SelectTrigger>
            <SelectContent>
              {professionals.map((professional) => (
                <SelectItem key={professional.id} value={professional.id}>
                  {professional.name} - {professional.profession}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProfessional && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Agenda de {selectedProfessionalData?.name}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateWeek('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[200px] text-center">
                  {format(startOfWeek(currentWeek, { weekStartsOn: 0 }), 'dd/MM', { locale: ptBR })} - {format(endOfWeek(currentWeek, { weekStartsOn: 0 }), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateWeek('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <WeeklyScheduleGrid
              currentWeek={currentWeek}
              appointments={appointments}
              onSlotClick={handleSlotClick}
              loading={loading}
            />
          </CardContent>
        </Card>
      )}

      <AppointmentFormDialog
        isOpen={isAppointmentFormOpen}
        onClose={() => {
          setIsAppointmentFormOpen(false);
          setSelectedSlot(null);
        }}
        selectedSlot={selectedSlot}
        selectedProfessional={selectedProfessionalData}
        onAppointmentCreated={handleAppointmentCreated}
      />
    </div>
  );
};

export default SchedulingCalendar;
