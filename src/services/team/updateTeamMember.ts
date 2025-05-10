
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { handleError } from './utils';

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
