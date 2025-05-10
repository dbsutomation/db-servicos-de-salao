
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';

interface TeamMemberSelectProps {
  form: UseFormReturn<any>;
  teamMembers: any[];
  loading: boolean;
}

const TeamMemberSelect = ({ form, teamMembers, loading }: TeamMemberSelectProps) => {
  const { currentUser } = useAuth();
  
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
            disabled={loading || (!!currentUser && !currentUser.isManager)}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {teamMembers && teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  Nenhum profissional disponível
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TeamMemberSelect;
