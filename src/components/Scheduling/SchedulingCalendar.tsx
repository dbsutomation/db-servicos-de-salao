
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import WeeklyScheduleGrid from './WeeklyScheduleGrid';
import MobileScheduleGrid from './MobileScheduleGrid';
import AppointmentFormDialog from './AppointmentFormDialog';
import EditAppointmentDialog from './EditAppointmentDialog';
import DeleteAppointmentDialog from './DeleteAppointmentDialog';
import BlockPeriodDialog from './BlockPeriodDialog';
import ProfessionalSelector from './ProfessionalSelector';
import WeekNavigation from './WeekNavigation';
import { useSchedulingCalendar } from '@/hooks/useSchedulingCalendar';
import { useMediaQuery } from '@/hooks/use-mobile';
import { Appointment } from '@/types';
import { CalendarOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SchedulingCalendar = () => {
  const {
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
  } = useSchedulingCalendar();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBlockPeriodDialogOpen, setIsBlockPeriodDialogOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const { toast } = useToast();

  const handleEditAppointment = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setIsEditDialogOpen(true);
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) return;

    try {
      // Excluir serviços do agendamento primeiro
      const { error: servicesError } = await supabase
        .from('appointment_services')
        .delete()
        .eq('appointment_id', appointmentToDelete.id);

      if (servicesError) throw servicesError;

      // Excluir o agendamento
      const { error: appointmentError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentToDelete.id);

      if (appointmentError) throw appointmentError;

      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso!",
      });

      handleAppointmentCreated(); // Recarrega os dados
      setIsDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agendamento.",
        variant: "destructive",
      });
    }
  };

  const handleAppointmentUpdated = () => {
    handleAppointmentCreated(); // Reutiliza a função para recarregar os dados
    setIsEditDialogOpen(false);
    setAppointmentToEdit(null);
  };

  const handlePeriodBlocked = () => {
    handleAppointmentCreated(); // Recarrega os dados
    setIsBlockPeriodDialogOpen(false);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setAppointmentToEdit(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setAppointmentToDelete(null);
  };

  return (
    <div className="space-y-6">
      <ProfessionalSelector
        professionals={professionals}
        selectedProfessional={selectedProfessional}
        onProfessionalChange={setSelectedProfessional}
      />

      {selectedProfessional && (
        <Card className="shadow-lg border-gray-200">
          {!isMobile && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <WeekNavigation
                currentWeek={currentWeek}
                onWeekChange={setCurrentWeek}
                professionalName={selectedProfessionalData?.name}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBlockPeriodDialogOpen(true)}
                className="flex items-center space-x-2"
              >
                <CalendarOff className="h-4 w-4" />
                <span>Bloquear Período</span>
              </Button>
            </div>
          )}
          
          {isMobile && (
            <div className="p-4 border-b border-gray-200 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Agenda de {selectedProfessionalData?.name}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBlockPeriodDialogOpen(true)}
                className="w-full flex items-center justify-center space-x-2"
              >
                <CalendarOff className="h-4 w-4" />
                <span>Bloquear Período</span>
              </Button>
            </div>
          )}

          <div className="overflow-hidden">
            {isMobile ? (
              <MobileScheduleGrid
                currentWeek={currentWeek}
                appointments={appointments}
                onSlotClick={handleSlotClick}
                loading={loading}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            ) : (
              <WeeklyScheduleGrid
                currentWeek={currentWeek}
                appointments={appointments}
                onSlotClick={handleSlotClick}
                onEditAppointment={handleEditAppointment}
                onDeleteAppointment={handleDeleteAppointment}
                loading={loading}
              />
            )}
          </div>
        </Card>
      )}

      <AppointmentFormDialog
        isOpen={isAppointmentFormOpen}
        onClose={closeAppointmentForm}
        selectedSlot={selectedSlot}
        selectedProfessional={selectedProfessionalData}
        onAppointmentCreated={handleAppointmentCreated}
      />

      <EditAppointmentDialog
        isOpen={isEditDialogOpen}
        onClose={closeEditDialog}
        appointment={appointmentToEdit}
        onAppointmentUpdated={handleAppointmentUpdated}
      />

      <DeleteAppointmentDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        appointment={appointmentToDelete}
      />

      <BlockPeriodDialog
        isOpen={isBlockPeriodDialogOpen}
        onClose={() => setIsBlockPeriodDialogOpen(false)}
        professionalId={selectedProfessional}
        onPeriodBlocked={handlePeriodBlocked}
      />
    </div>
  );
};

export default SchedulingCalendar;
