
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useTeamData } from './useTeamData';
import { useTeamDialog } from './useTeamDialog';
import { 
  createTeamMember,
  updateTeamMember, 
  deleteTeamMember 
} from '@/services/team';

export const useTeamManagement = () => {
  const { currentUser } = useAuth();
  const { 
    teamMembersList, 
    loading, 
    refreshTeamMembers 
  } = useTeamData();
  
  const { 
    dialogOpen,
    setDialogOpen,
    editingMember,
    setEditingMember,
    deleteDialogOpen,
    setDeleteDialogOpen,
    memberToDelete,
    setMemberToDelete,
    handleEdit,
    confirmDeleteMember
  } = useTeamDialog();

  const handleSuccess = useCallback(async (data: any) => {
    let success = false;
    
    try {
      if (editingMember) {
        console.log("Atualizando membro existente:", editingMember);
        success = await updateTeamMember(editingMember, data);
      } else {
        console.log("Criando novo membro");
        success = await createTeamMember(data);
      }
      
      if (success) {
        // Close the dialog first to prevent state updates during render
        setDialogOpen(false);
        setEditingMember(null);
        
        // Then refresh the team members list after a brief timeout
        setTimeout(() => {
          refreshTeamMembers();
        }, 100);
      }
    } catch (error) {
      console.error("Erro ao processar operação do membro:", error);
    }
  }, [editingMember, setDialogOpen, setEditingMember, refreshTeamMembers]);

  const handleDeleteMember = useCallback(async () => {
    if (memberToDelete) {
      const member = teamMembersList.find(m => m.id === memberToDelete);
      
      // Don't allow deleting yourself
      if (member && member.id === currentUser?.id) {
        toast({
          title: "Operação não permitida",
          description: "Você não pode excluir seu próprio perfil.",
          variant: "destructive"
        });
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
        return;
      }
      
      console.log("Excluindo membro:", memberToDelete, member?.name);
      const success = await deleteTeamMember(memberToDelete, member?.name);
      
      if (success) {
        // Close dialog first
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
        
        // Then refresh data after a brief timeout
        setTimeout(() => {
          refreshTeamMembers();
        }, 100);
      } else {
        // Still reset state if delete failed
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
      }
    }
  }, [memberToDelete, teamMembersList, currentUser?.id, setDeleteDialogOpen, setMemberToDelete, refreshTeamMembers]);

  return {
    teamMembersList,
    dialogOpen,
    setDialogOpen,
    editingMember,
    setEditingMember,
    deleteDialogOpen,
    setDeleteDialogOpen,
    memberToDelete,
    loading,
    handleSuccess,
    handleEdit,
    confirmDeleteMember,
    handleDeleteMember,
    refreshTeamMembers
  };
};

export default useTeamManagement;
