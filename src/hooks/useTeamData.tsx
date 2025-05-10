
import { useState, useEffect } from 'react';
import { TeamMember } from '@/types';
import { fetchTeamMembers } from '@/services/teamService';
import { toast } from '@/hooks/use-toast';

export const useTeamData = () => {
  const [teamMembersList, setTeamMembersList] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      const members = await fetchTeamMembers();
      setTeamMembersList(members);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast({
        title: "Erro ao carregar equipe",
        description: "Não foi possível carregar os dados da equipe. Verifique sua conexão.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, []);

  return {
    teamMembersList,
    loading,
    refreshTeamMembers: loadTeamMembers
  };
};

export default useTeamData;
