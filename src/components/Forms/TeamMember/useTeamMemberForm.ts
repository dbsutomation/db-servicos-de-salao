
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
      hasAccess: isEditing ? undefined : false,
      isManager: false,
      categories: []
    }
  });

  useEffect(() => {
    if (teamMemberId) {
      setIsLoading(true);
      console.log("Carregando dados do profissional:", teamMemberId);
      
      const fetchTeamMember = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', teamMemberId)
            .single();
          
          if (error) {
            console.error('Error fetching user:', error);
            toast({
              title: "Erro ao carregar dados",
              description: "Não foi possível carregar os dados do profissional selecionado.",
              variant: "destructive"
            });
            return;
          }
          
          if (data) {
            console.log("Dados do profissional carregados:", data);
            
            form.reset({
              name: data.name || '',
              profession: data.profession || '',
              phone: data.phone || '',
              email: data.email || '',
              password: '',
              hasAccess: data.has_access,
              isManager: data.is_manager,
              categories: data.categories || []
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
  }, [teamMemberId, form]);

  const handleSubmit = (data: TeamMemberFormValues) => {
    console.log("Dados do formulário:", data);
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
