
import { useState, useCallback } from 'react';
import { TeamMember } from '@/types';
import { fetchTeamMembers } from '@/services/team';

export const useTeamData = () => {
  const [teamMembersList, setTeamMembersList] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Use useCallback to prevent refreshTeamMembers from causing re-renders
  const refreshTeamMembers = useCallback(async () => {
    setLoading(true);
    try {
      const members = await fetchTeamMembers();
      setTeamMembersList(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    teamMembersList,
    loading,
    refreshTeamMembers
  };
};

export default useTeamData;
