
import { useState, useCallback } from 'react';
import { Appointment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook customizado para gerenciar estados e ações dos dialogs de agendamento
 * 
 * Centraliza toda a lógica relacionada aos dialogs de edição, exclusão e bloqueio
 * proporcionando melhor organização e reutilização de código
 */
export const useSchedulingDialogs = (onDataChange: () => void) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isBlockPeriodDialogOpen, setIsBlockPeriodDialogOpen] = useState<boolean>(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const { toast } = useToast();

  /**
   * Abre o dialog de bloqueio de período
   */
  const openBlockPeriodDialog = useCallback(() => {
    setIsBlockPeriodDialogOpen(true);
  }, []);

  /**
   * Inicia o processo de edição de um agendamento
   * @param appointment - Agendamento a ser editado
   */
  const handleEditAppointment = useCallback((appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setIsEditDialogOpen(true);
  }, []);

  /**
   * Inicia o processo de exclusão de um agendamento
   * @param appointment - Agendamento a ser excluído
   */
  const handleDeleteAppointment = useCallback((appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setIsDeleteDialogOpen(true);
  }, []);

  /**
   * Confirma e executa a exclusão de um agendamento
   * Executa operações de exclusão de forma sequencial com tratamento de erro robusto
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!appointmentToDelete) return;

    setIsDeleting(true);
    
    try {
      console.log('Iniciando exclusão do agendamento:', appointmentToDelete.id);
      
      // Remove serviços relacionados ao agendamento
      const { error: servicesError } = await supabase
        .from('appointment_services')
        .delete()
        .eq('appointment_id', appointmentToDelete.id);

      if (servicesError) {
        console.error('Erro ao excluir serviços:', servicesError);
        throw servicesError;
      }

      console.log('Serviços excluídos com sucesso');

      // Remove o agendamento principal
      const { error: appointmentError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentToDelete.id);

      if (appointmentError) {
        console.error('Erro ao excluir agendamento:', appointmentError);
        // Se falhar aqui, os serviços já foram removidos
        // Idealmente deveríamos ter uma transação, mas informamos o usuário
        toast({
          title: "Erro crítico",
          description: "Falha na exclusão do agendamento. Entre em contato com o suporte técnico.",
          variant: "destructive",
        });
        throw appointmentError;
      }

      console.log('Agendamento excluído com sucesso');

      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso!",
      });

      onDataChange();
      closeDeleteDialog();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [appointmentToDelete, onDataChange, toast]);

  /**
   * Callback executado após atualização bem-sucedida de agendamento
   */
  const handleAppointmentUpdated = useCallback(() => {
    onDataChange();
    closeEditDialog();
  }, [onDataChange]);

  /**
   * Callback executado após bloqueio bem-sucedido de período
   */
  const handlePeriodBlocked = useCallback(() => {
    onDataChange();
    setIsBlockPeriodDialogOpen(false);
  }, [onDataChange]);

  /**
   * Fecha o dialog de edição e limpa estado
   */
  const closeEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setAppointmentToEdit(null);
  }, []);

  /**
   * Fecha o dialog de exclusão e limpa estado
   */
  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setAppointmentToDelete(null);
  }, []);

  /**
   * Fecha o dialog de bloqueio de período
   */
  const closeBlockPeriodDialog = useCallback(() => {
    setIsBlockPeriodDialogOpen(false);
  }, []);

  return {
    // Estados
    isEditDialogOpen,
    isDeleteDialogOpen,
    isBlockPeriodDialogOpen,
    appointmentToEdit,
    appointmentToDelete,
    isDeleting,
    
    // Ações
    openBlockPeriodDialog,
    handleEditAppointment,
    handleDeleteAppointment,
    handleConfirmDelete,
    handleAppointmentUpdated,
    handlePeriodBlocked,
    closeEditDialog,
    closeDeleteDialog,
    closeBlockPeriodDialog,
  };
};
