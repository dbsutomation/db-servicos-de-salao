
import { useState, useEffect } from 'react';
import { TeamMember } from '@/types';
import { fetchTeamMembers } from '@/services/teamService';

export const useTeamData = () => {
  const [teamMembersList, setTeamMembersList] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeamMembers = async () => {
    setLoading(true);
    const members = await fetchTeamMembers();
    setTeamMembersList(members);
    setLoading(false);
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
