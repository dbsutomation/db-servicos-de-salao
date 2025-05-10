
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types';
import { toast } from '@/hooks/use-toast';

export const fetchTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    
    // Transform data to match TeamMember type
    const transformedData = data.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      hasAccess: user.has_access,
      isManager: user.is_manager,
      phone: user.phone || '',  // Use empty string if phone is null
      profession: user.profession || '',  // Use empty string if profession is null
      password: '',  // Password is not returned from the database
      avatar: user.avatar || '/placeholder.svg'  // Use placeholder if avatar is null
    }));
    
    return transformedData;
  } catch (error: any) {
    toast({
      title: "Erro ao carregar equipe",
      description: error.message || "Não foi possível carregar os membros da equipe",
      variant: "destructive"
    });
    return [];
  }
};

export const updateTeamMember = async (memberId: string, data: any): Promise<boolean> => {
  try {
    console.log("Atualizando membro:", memberId, data);
    
    // Preparar dados para atualização
    const updateData: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      profession: data.profession,
      has_access: data.hasAccess,
      is_manager: data.isManager
    };
    
    // If the password was provided, handle it separately for security
    if (data.password && data.password.trim() !== '') {
      console.log("Senha nova detectada, atualizando...");
      // In a real production scenario, password updates would be handled more securely
    }
    
    // Update member in Supabase
    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', memberId);
      
    if (error) throw error;
    
    toast({
      title: "Membro atualizado",
      description: `${data.name} foi atualizado com sucesso.`
    });
    
    return true;
  } catch (error: any) {
    handleError(error, "ao atualizar o membro da equipe");
    return false;
  }
};

export const createTeamMember = async (data: any): Promise<boolean> => {
  try {
    // Prepare data for insertion
    const insertData: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      profession: data.profession,
      has_access: data.hasAccess,
      is_manager: data.isManager
      // Password would be handled separately in a real scenario
    };
    
    // Add new team member to Supabase
    const { error } = await supabase
      .from('users')
      .insert(insertData);
      
    if (error) throw error;
    
    toast({
      title: "Membro adicionado",
      description: `${data.name} foi adicionado com sucesso.`
    });
    
    return true;
  } catch (error: any) {
    handleError(error, "ao salvar o membro da equipe");
    return false;
  }
};

export const deleteTeamMember = async (memberId: string, memberName?: string): Promise<boolean> => {
  try {
    console.log("Excluindo membro:", memberId);
    
    // Delete from Supabase
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', memberId);
      
    if (error) throw error;
    
    if (memberName) {
      toast({
        title: "Membro removido",
        description: `${memberName} foi removido com sucesso.`
      });
    }
    
    return true;
  } catch (error: any) {
    let errorMessage = error.message || "Ocorreu um erro ao excluir o membro da equipe";
    
    // Handling specific deletion errors
    if (error.code === '23503') {
      errorMessage = "Este membro não pode ser excluído pois possui registros associados";
    }
    
    toast({
      title: "Erro",
      description: errorMessage,
      variant: "destructive"
    });
    return false;
  }
};

// Helper function to handle common error cases
const handleError = (error: any, action: string): void => {
  let errorMessage = error.message || `Ocorreu um erro ${action}`;
  
  // Specific error code handling
  if (error.code === '23505') {
    errorMessage = "Este email já está em uso por outro membro";
  } else if (error.code === '23514') {
    errorMessage = "Os dados fornecidos não atendem às restrições do banco de dados";
  }
  
  console.error("Erro:", error);
  
  toast({
    title: "Erro",
    description: errorMessage,
    variant: "destructive"
  });
};
