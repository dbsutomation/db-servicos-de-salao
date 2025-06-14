
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WeeklyScheduleGrid } from './Grid/WeeklyScheduleGrid';
import { MobileScheduleGrid } from './Mobile/MobileScheduleGrid';
import { AppointmentFormDialog } from './Forms/AppointmentFormDialog';
import { EditAppointmentDialog } from './Forms/EditAppointmentDialog';
import { DeleteAppointmentDialog } from './Dialogs/DeleteAppointmentDialog';
import { BlockPeriodDialog } from './Dialogs/BlockPeriodDialog';
import { ProfessionalSelector } from './Selection/ProfessionalSelector';
import { WeekNavigation } from './Navigation/WeekNavigation';
import { useSchedulingCalendar } from '@/hooks/useSchedulingCalendar';
import { useMediaQuery } from '@/hooks/use-mobile';
import { Appointment } from '@/types';
import { CalendarOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Componente principal do sistema de agendamento
 * 
 * Gerencia todo o fluxo de agendamentos incluindo:
 * - Seleção de profissionais
 * - Visualização da agenda (desktop e mobile)
 * - Criação, edição e exclusão de agendamentos
 * - Bloqueio de períodos
 * - Navegação entre semanas
 * 
 * Este componente atua como orquestrador, delegando responsabilidades
 * específicas para subcomponentes especializados.
 */
export const SchedulingCalendar = () => {
  // Hook personalizado que gerencia toda a lógica de estado da agenda
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
    closeAppointmentForm,
    isSlotBlocked
  } = useSchedulingCalendar();

  // Estados para controlar dialogs de ação
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBlockPeriodDialogOpen, setIsBlockPeriodDialogOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  // Hook para detectar dispositivos móveis
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { toast } = useToast();

  /**
   * Inicia o processo de edição de um agendamento
   * Armazena o agendamento selecionado e abre o dialog de edição
   */
  const handleEditAppointment = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setIsEditDialogOpen(true);
  };

  /**
   * Inicia o processo de exclusão de um agendamento
   * Armazena o agendamento selecionado e abre o dialog de confirmação
   */
  const handleDeleteAppointment = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setIsDeleteDialogOpen(true);
  };

  /**
   * Confirma e executa a exclusão de um agendamento
   * Remove primeiro os serviços relacionados, depois o agendamento principal
   */
  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) return;

    try {
      // Remove serviços relacionados ao agendamento
      const { error: servicesError } = await supabase
        .from('appointment_services')
        .delete()
        .eq('appointment_id', appointmentToDelete.id);

      if (servicesError) throw servicesError;

      // Remove o agendamento principal
      const { error: appointmentError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentToDelete.id);

      if (appointmentError) throw appointmentError;

      // Feedback de sucesso
      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso!",
      });

      // Atualiza a interface e limpa estados
      handleAppointmentCreated();
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

  /**
   * Callback executado após atualização bem-sucedida de agendamento
   * Recarrega dados e fecha dialogs
   */
  const handleAppointmentUpdated = () => {
    handleAppointmentCreated();
    setIsEditDialogOpen(false);
    setAppointmentToEdit(null);
  };

  /**
   * Callback executado após bloqueio bem-sucedido de período
   * Recarrega dados e fecha dialog
   */
  const handlePeriodBlocked = () => {
    handleAppointmentCreated();
    setIsBlockPeriodDialogOpen(false);
  };

  /**
   * Fecha o dialog de edição e limpa estado
   */
  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setAppointmentToEdit(null);
  };

  /**
   * Fecha o dialog de exclusão e limpa estado
   */
  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setAppointmentToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Seletor de profissional - sempre visível no topo */}
      <ProfessionalSelector
        professionals={professionals}
        selectedProfessional={selectedProfessional}
        onProfessionalChange={setSelectedProfessional}
      />

      {/* Agenda principal - só aparece quando um profissional está selecionado */}
      {selectedProfessional && (
        <Card className="shadow-lg border-gray-200">
          {/* Header da agenda - layout diferente para desktop e mobile */}
          {!isMobile && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              {/* Navegação da semana e nome do profissional */}
              <WeekNavigation
                currentWeek={currentWeek}
                onWeekChange={setCurrentWeek}
                professionalName={selectedProfessionalData?.name}
              />
              {/* Botão para bloquear período */}
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
          
          {/* Header simplificado para mobile */}
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

          {/* Grade da agenda - componente diferente para desktop e mobile */}
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
                isSlotBlocked={isSlotBlocked}
              />
            )}
          </div>
        </Card>
      )}

      {/* Dialogs de ação - gerenciam fluxos específicos */}
      
      {/* Dialog para criar novo agendamento */}
      <AppointmentFormDialog
        isOpen={isAppointmentFormOpen}
        onClose={closeAppointmentForm}
        selectedSlot={selectedSlot}
        selectedProfessional={selectedProfessionalData}
        onAppointmentCreated={handleAppointmentCreated}
      />

      {/* Dialog para editar agendamento existente */}
      <EditAppointmentDialog
        isOpen={isEditDialogOpen}
        onClose={closeEditDialog}
        appointment={appointmentToEdit}
        onAppointmentUpdated={handleAppointmentUpdated}
      />

      {/* Dialog de confirmação para exclusão */}
      <DeleteAppointmentDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        appointment={appointmentToDelete}
      />

      {/* Dialog para bloquear períodos */}
      <BlockPeriodDialog
        isOpen={isBlockPeriodDialogOpen}
        onClose={() => setIsBlockPeriodDialogOpen(false)}
        professionalId={selectedProfessional}
        onPeriodBlocked={handlePeriodBlocked}
      />
    </div>
  );
};
