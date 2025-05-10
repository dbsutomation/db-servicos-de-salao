
import { useState, useEffect, useCallback } from 'react';
import { TeamMember } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchTeamMembers, 
  createTeamMember, 
  updateTeamMember, 
  deleteTeamMember 
} from '@/services/team';

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const { currentUser } = useAuth();

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

  const handleCreateOrUpdate = async (member: TeamMember) => {
    setIsLoading(true);
    try {
      if (member.id) {
        // Check if user can edit this member
        const canEdit = currentUser?.isManager || member.id === currentUser?.id;
        if (!canEdit) {
          throw new Error("Você não tem permissão para editar este membro");
        }
        
        // Update existing member
        await updateTeamMember(member);
        toast({
          title: "Sucesso",
          description: "Membro atualizado com sucesso",
        });
      } else {
        // Check if user can create new members
        if (!currentUser?.isManager) {
          throw new Error("Apenas gerentes podem adicionar novos membros");
        }
        
        // Create new member
        await createTeamMember(member);
        toast({
          title: "Sucesso",
          description: "Membro adicionado com sucesso",
        });
      }
      await loadTeamMembers(); // Reload the list after changes
    } catch (error: any) {
      console.error('Error creating/updating team member:', error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao processar o membro da equipe",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async (memberId: string) => {
    // Check if user can delete members
    if (!currentUser?.isManager) {
      toast({
        title: "Erro",
        description: "Apenas gerentes podem excluir membros da equipe",
        variant: "destructive",
      });
      return;
    }
    
    // Prevent deleting yourself
    if (currentUser?.id === memberId) {
      toast({
        title: "Erro",
        description: "Você não pode excluir sua própria conta",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await deleteTeamMember(memberId);
      toast({
        title: "Sucesso",
        description: "Membro removido com sucesso",
      });
      await loadTeamMembers(); // Reload the list after deletion
    } catch (error: any) {
      console.error('Error deleting team member:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o membro da equipe",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    teamMembers,
    isLoading,
    loadTeamMembers,
    handleCreateOrUpdate,
    handleConfirmDelete,
  };
};

export default useTeamMembers;
