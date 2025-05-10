
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { teamMemberFormSchema, TeamMemberFormValues } from './validationSchema';

interface UseTeamMemberFormProps {
  teamMemberId?: string | null;
  onSuccess: (data: TeamMemberFormValues) => void;
}

const useTeamMemberForm = ({ teamMemberId, onSuccess }: UseTeamMemberFormProps) => {
  const isEditing = !!teamMemberId;
  const schema = teamMemberFormSchema(isEditing);
  
  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      profession: '',
      phone: '',
      email: '',
      password: '',
      hasAccess: isEditing ? undefined : false, // Padrão false para novos membros
      isManager: false
    }
  });

  // Populate form when editing an existing team member
  useEffect(() => {
    if (teamMemberId) {
      console.log("Carregando dados do membro:", teamMemberId);
      
      const fetchTeamMember = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', teamMemberId)
            .single();
          
          if (error) {
            console.error('Error fetching team member:', error);
            return;
          }
          
          if (data) {
            console.log("Dados do membro carregados:", data);
            
            form.reset({
              name: data.name || '',
              profession: data.profession || '',
              phone: data.phone || '',
              email: data.email || '',
              password: '', // Password is not fetched from the database
              hasAccess: data.has_access,
              isManager: data.is_manager
            });
          }
        } catch (error) {
          console.error('Error in fetchTeamMember:', error);
        }
      };

      fetchTeamMember();
    }
  }, [teamMemberId, form]);

  const handleSubmit = (data: TeamMemberFormValues) => {
    console.log("Dados do formulário:", data);
    onSuccess(data);
  };

  return {
    form,
    isEditing,
    handleSubmit: form.handleSubmit(handleSubmit)
  };
};

export default useTeamMemberForm;
