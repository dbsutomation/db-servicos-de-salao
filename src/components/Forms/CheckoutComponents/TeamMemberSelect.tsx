
import React, { useEffect, useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { TeamMember } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TeamMemberSelectProps {
  form: UseFormReturn<any>;
  teamMembers: TeamMember[];
  loading: boolean;
}

const TeamMemberSelect = ({ form, teamMembers, loading }: TeamMemberSelectProps) => {
  const { currentUser } = useAuth();
  const [databaseTeamMembers, setDatabaseTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch team members directly from the database to ensure we're showing all available options
  useEffect(() => {
    const fetchTeamMembers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, profession, is_manager, has_access')
          .order('name', { ascending: true });
          
        if (error) {
          console.error('Error fetching team members:', error);
          return;
        }
        
        if (data) {
          // Map the database fields to the TeamMember interface
          const mappedMembers = data.map(member => ({
            id: member.id,
            name: member.name,
            email: '', // These fields aren't needed for the dropdown
            phone: '',
            profession: member.profession || '',
            password: '',
            hasAccess: member.has_access,
            isManager: member.is_manager,
            avatar: ''
          }));
          
          setDatabaseTeamMembers(mappedMembers);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeamMembers();
  }, []);
  
  // Use the fetched team members if available, otherwise use the prop
  const displayTeamMembers = databaseTeamMembers.length > 0 ? databaseTeamMembers : teamMembers;
  
  return (
    <FormField
      control={form.control}
      name="teamMember"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Profissional</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
            disabled={isLoading || loading || (!!currentUser && !currentUser.isManager)}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {displayTeamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TeamMemberSelect;
