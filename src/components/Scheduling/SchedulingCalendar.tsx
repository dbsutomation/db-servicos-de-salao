
import React from 'react';
import { Card } from '@/components/ui/card';
import { WeeklyScheduleGrid } from './Grid/WeeklyScheduleGrid';
import { MobileScheduleGrid } from './Mobile/MobileScheduleGrid';
import { ProfessionalSelector } from './Selection/ProfessionalSelector';
import { SchedulingHeader } from './Header/SchedulingHeader';
import { SchedulingDialogs } from './Dialogs/SchedulingDialogs';
import { useSchedulingCalendar } from '@/hooks/useSchedulingCalendar';
import { useSchedulingDialogs } from '@/hooks/useSchedulingDialogs';
import { useMediaQuery } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

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

  // Hook personalizado para gerenciar dialogs
  const dialogActions = useSchedulingDialogs(handleAppointmentCreated);

  // Hook para detectar dispositivos móveis
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Verifica se os dados necessários estão carregados antes de renderizar
  const hasValidData = professionals.length > 0;
  const hasSelectedProfessional = selectedProfessional && selectedProfessionalData;

  return (
    <div className="space-y-6">
      {/* Indicador de carregamento global para operações críticas */}
      {dialogActions.isDeleting && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Excluindo agendamento...</span>
          </div>
        </div>
      )}

      {/* Seletor de profissional - só renderiza quando há dados */}
      {hasValidData && (
        <ProfessionalSelector
          professionals={professionals}
          selectedProfessional={selectedProfessional}
          onProfessionalChange={setSelectedProfessional}
        />
      )}

      {/* Agenda principal - só aparece quando um profissional está selecionado e dados estão válidos */}
      {hasValidData && hasSelectedProfessional && (
        <Card className="shadow-lg border-gray-200">
          {/* Header da agenda - componente unificado para mobile e desktop */}
          <SchedulingHeader
            currentWeek={currentWeek}
            onWeekChange={setCurrentWeek}
            professionalData={selectedProfessionalData}
            onBlockPeriodClick={dialogActions.openBlockPeriodDialog}
            isMobile={isMobile}
          />

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
                onEditAppointment={dialogActions.handleEditAppointment}
                onDeleteAppointment={dialogActions.handleDeleteAppointment}
                loading={loading}
                isSlotBlocked={isSlotBlocked}
              />
            )}
          </div>
        </Card>
      )}

      {/* Dialogs de ação - componente separado para melhor organização */}
      <SchedulingDialogs
        isAppointmentFormOpen={isAppointmentFormOpen}
        onCloseAppointmentForm={closeAppointmentForm}
        selectedSlot={selectedSlot}
        selectedProfessional={selectedProfessionalData}
        onAppointmentCreated={handleAppointmentCreated}
        isEditDialogOpen={dialogActions.isEditDialogOpen}
        onCloseEditDialog={dialogActions.closeEditDialog}
        appointmentToEdit={dialogActions.appointmentToEdit}
        onAppointmentUpdated={dialogActions.handleAppointmentUpdated}
        isDeleteDialogOpen={dialogActions.isDeleteDialogOpen}
        onDeleteDialogChange={dialogActions.closeDeleteDialog}
        appointmentToDelete={dialogActions.appointmentToDelete}
        onConfirmDelete={dialogActions.handleConfirmDelete}
        isDeleting={dialogActions.isDeleting}
        isBlockPeriodDialogOpen={dialogActions.isBlockPeriodDialogOpen}
        onCloseBlockPeriod={dialogActions.closeBlockPeriodDialog}
        selectedProfessionalId={selectedProfessional}
        onPeriodBlocked={dialogActions.handlePeriodBlocked}
      />
    </div>
  );
};
