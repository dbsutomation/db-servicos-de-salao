
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types';
import { toast } from '@/hooks/use-toast';

export const fetchTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    console.log("Fetching team members...");
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error("Error fetching team members:", error);
      throw error;
    }
    
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
    
    console.log("Team members fetched successfully:", transformedData.length);
    return transformedData;
  } catch (error: any) {
    console.error("Error in fetchTeamMembers:", error);
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
    if (!memberId) {
      console.error("Missing member ID for update");
      throw new Error("ID do membro não fornecido para atualização");
    }
    
    console.log("Updating team member with ID:", memberId);
    console.log("Update data:", data);
    
    // Prepare data for update
    const updateData = {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      profession: data.profession || null,
      has_access: data.hasAccess,
      is_manager: data.isManager
    };
    
    // First check if the member exists
    const { data: existingMember, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', memberId)
      .single();
      
    if (checkError) {
      console.error("Error checking if member exists:", checkError);
      throw new Error("Membro não encontrado ou erro ao verificar existência");
    }
    
    if (!existingMember) {
      console.error("Member not found for ID:", memberId);
      throw new Error("Membro não encontrado para atualização");
    }
    
    // Update member in Supabase
    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', memberId);
      
    if (error) {
      console.error("Error in update operation:", error);
      throw error;
    }
    
    console.log("Member updated successfully:", memberId);
    
    toast({
      title: "Membro atualizado",
      description: `${data.name} foi atualizado com sucesso.`
    });
    
    return true;
  } catch (error: any) {
    console.error("Complete error in update:", error);
    handleError(error, "ao atualizar o membro da equipe");
    return false;
  }
};

export const createTeamMember = async (data: any): Promise<boolean> => {
  try {
    console.log("Creating new member with data:", data);
    
    // Prepare data for insertion
    const insertData = {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      profession: data.profession || null,
      has_access: data.hasAccess,
      is_manager: data.isManager
    };
    
    // Add new team member to Supabase
    const { data: newMember, error } = await supabase
      .from('users')
      .insert(insertData)
      .select();
      
    if (error) {
      console.error("Error in insert operation:", error);
      throw error;
    }
    
    console.log("New member created:", newMember);
    
    toast({
      title: "Membro adicionado",
      description: `${data.name} foi adicionado com sucesso.`
    });
    
    return true;
  } catch (error: any) {
    console.error("Complete error in creation:", error);
    handleError(error, "ao salvar o membro da equipe");
    return false;
  }
};

export const deleteTeamMember = async (memberId: string, memberName?: string): Promise<boolean> => {
  try {
    if (!memberId) {
      console.error("Missing member ID for delete");
      throw new Error("ID do membro não fornecido para exclusão");
    }
    
    console.log("Deleting member with ID:", memberId);
    
    // First check if the member exists
    const { data: existingMember, error: checkError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', memberId)
      .single();
      
    if (checkError) {
      console.error("Error checking if member exists:", checkError);
      if (checkError.code === 'PGRST116') {
        // This is the error when no rows are returned
        throw new Error("Membro não encontrado para exclusão");
      }
      throw checkError;
    }
    
    if (!existingMember) {
      console.error("Member not found for ID:", memberId);
      throw new Error("Membro não encontrado para exclusão");
    }
    
    // Delete from Supabase
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', memberId);
      
    if (error) {
      console.error("Error in delete operation:", error);
      throw error;
    }
    
    console.log("Member deleted successfully:", memberId);
    
    if (memberName) {
      toast({
        title: "Membro removido",
        description: `${memberName} foi removido com sucesso.`
      });
    }
    
    return true;
  } catch (error: any) {
    console.error("Complete error in deletion:", error);
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
  
  console.error("Detailed error:", error);
  
  toast({
    title: "Erro",
    description: errorMessage,
    variant: "destructive"
  });
};
