
import { useState, useEffect, useCallback } from 'react';
import { TeamMember } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchTeamMembers, 
  createTeamMember, 
  updateTeamMember, 
  deleteTeamMember 
} from '@/services/team';

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const { toast } = useToast();

  const loadTeamMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchTeamMembers();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os membros da equipe",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  const handleAddMember = () => {
    setSelectedMember(null);
    setDialogOpen(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember({...member, password: ''}); // Clear password for security
    setDialogOpen(true);
  };

  const handleDeleteClick = (member: TeamMember) => {
    setSelectedMember(member);
    setDeleteDialogOpen(true);
  };

  const handleCreateOrUpdate = async (member: TeamMember) => {
    setIsLoading(true);
    try {
      if (member.id) {
        // Update existing member
        await updateTeamMember(member);
        toast({
          title: "Sucesso",
          description: "Membro atualizado com sucesso",
        });
      } else {
        // Create new member
        await createTeamMember(member);
        toast({
          title: "Sucesso",
          description: "Membro adicionado com sucesso",
        });
      }
      setDialogOpen(false);
      await loadTeamMembers(); // Reload the list after changes
    } catch (error: any) {
      console.error('Error creating/updating team member:', error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao processar o membro da equipe",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedMember) return;
    
    setIsLoading(true);
    try {
      await deleteTeamMember(selectedMember.id);
      toast({
        title: "Sucesso",
        description: "Membro removido com sucesso",
      });
      setDeleteDialogOpen(false);
      await loadTeamMembers(); // Reload the list after deletion
    } catch (error: any) {
      console.error('Error deleting team member:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o membro da equipe",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    teamMembers,
    isLoading,
    selectedMember,
    setSelectedMember,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleAddMember,
    handleEditMember,
    handleDeleteClick,
    handleCreateOrUpdate,
    handleConfirmDelete,
  };
};

export default useTeamMembers;
