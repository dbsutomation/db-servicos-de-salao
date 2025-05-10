
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useTeamData } from './useTeamData';
import { useTeamDialog } from './useTeamDialog';
import { 
  createTeamMember,
  updateTeamMember, 
  deleteTeamMember 
} from '@/services/teamService';

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

  const handleSuccess = async (data: any) => {
    let success = false;
    
    if (editingMember) {
      success = await updateTeamMember(editingMember, data);
    } else {
      success = await createTeamMember(data);
    }
    
    if (success) {
      // Refresh the team members list
      await refreshTeamMembers();
      
      // Close the dialog and reset editing state
      setDialogOpen(false);
      setEditingMember(null);
    }
  };

  const handleDeleteMember = async () => {
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
      
      const success = await deleteTeamMember(memberToDelete, member?.name);
      
      if (success) {
        // Refresh the team members list
        await refreshTeamMembers();
      }
      
      // Reset state
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  };

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
  };
};

export default useTeamManagement;
