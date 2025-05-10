
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { teamMemberFormSchema, TeamMemberFormValues } from './validationSchema';
import { toast } from '@/hooks/use-toast';

interface UseTeamMemberFormProps {
  teamMemberId?: string | null;
  onSuccess: (data: TeamMemberFormValues) => void;
}

const useTeamMemberForm = ({ teamMemberId, onSuccess }: UseTeamMemberFormProps) => {
  const isEditing = !!teamMemberId;
  const [isLoading, setIsLoading] = useState(false);
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
    },
    mode: 'onChange' // Validate on change for better user feedback
  });

  // Populate form when editing an existing team member
  useEffect(() => {
    // Clear form first to prevent stale data
    form.reset({
      name: '',
      profession: '',
      phone: '',
      email: '',
      password: '',
      hasAccess: isEditing ? undefined : false,
      isManager: false
    });
    
    if (teamMemberId) {
      setIsLoading(true);
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
            toast({
              title: "Erro ao carregar dados",
              description: "Não foi possível carregar os dados do membro selecionado.",
              variant: "destructive"
            });
            setIsLoading(false);
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
        } finally {
          setIsLoading(false);
        }
      };

      fetchTeamMember();
    }
  }, [teamMemberId, form, isEditing]);

  const handleSubmit = (data: TeamMemberFormValues) => {
    console.log("Form data submitted:", data);
    onSuccess(data);
  };

  return {
    form,
    isEditing,
    isLoading,
    handleSubmit: form.handleSubmit(handleSubmit)
  };
};

export default useTeamMemberForm;
