
import React from 'react';
import { AppointmentFormDialog } from '../Forms/AppointmentFormDialog';
import { EditAppointmentDialog } from '../Forms/EditAppointmentDialog';
import { DeleteAppointmentDialog } from './DeleteAppointmentDialog';
import { BlockPeriodDialog } from './BlockPeriodDialog';
import { Appointment, TeamMember } from '@/types';

interface SchedulingDialogsProps {
  // Props do dialog de novo agendamento
  isAppointmentFormOpen: boolean;
  onCloseAppointmentForm: () => void;
  selectedSlot: {
    date: string;
    time: string;
    professionalId: string;
  } | null;
  selectedProfessional: TeamMember | undefined;
  onAppointmentCreated: () => void;

  // Props dos dialogs de edição e exclusão
  isEditDialogOpen: boolean;
  onCloseEditDialog: () => void;
  appointmentToEdit: Appointment | null;
  onAppointmentUpdated: () => void;

  isDeleteDialogOpen: boolean;
  onDeleteDialogChange: (open: boolean) => void;
  appointmentToDelete: Appointment | null;
  onConfirmDelete: () => void;
  isDeleting: boolean;

  // Props do dialog de bloqueio
  isBlockPeriodDialogOpen: boolean;
  onCloseBlockPeriod: () => void;
  selectedProfessionalId: string;
  onPeriodBlocked: () => void;
}

/**
 * Componente que agrupa todos os dialogs relacionados ao agendamento
 * Melhora a organização e reduz a complexidade do componente principal
 */
export const SchedulingDialogs = ({
  isAppointmentFormOpen,
  onCloseAppointmentForm,
  selectedSlot,
  selectedProfessional,
  onAppointmentCreated,
  isEditDialogOpen,
  onCloseEditDialog,
  appointmentToEdit,
  onAppointmentUpdated,
  isDeleteDialogOpen,
  onDeleteDialogChange,
  appointmentToDelete,
  onConfirmDelete,
  isDeleting,
  isBlockPeriodDialogOpen,
  onCloseBlockPeriod,
  selectedProfessionalId,
  onPeriodBlocked,
}: SchedulingDialogsProps) => {
  return (
    <>
      {/* Dialog para criar novo agendamento */}
      <AppointmentFormDialog
        isOpen={isAppointmentFormOpen}
        onClose={onCloseAppointmentForm}
        selectedSlot={selectedSlot}
        selectedProfessional={selectedProfessional}
        onAppointmentCreated={onAppointmentCreated}
      />

      {/* Dialog para editar agendamento existente */}
      <EditAppointmentDialog
        isOpen={isEditDialogOpen}
        onClose={onCloseEditDialog}
        appointment={appointmentToEdit}
        onAppointmentUpdated={onAppointmentUpdated}
      />

      {/* Dialog de confirmação para exclusão */}
      <DeleteAppointmentDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteDialogChange}
        onConfirm={onConfirmDelete}
        appointment={appointmentToDelete}
      />

      {/* Dialog para bloquear períodos */}
      <BlockPeriodDialog
        isOpen={isBlockPeriodDialogOpen}
        onClose={onCloseBlockPeriod}
        professionalId={selectedProfessionalId}
        onPeriodBlocked={onPeriodBlocked}
      />
    </>
  );
};
