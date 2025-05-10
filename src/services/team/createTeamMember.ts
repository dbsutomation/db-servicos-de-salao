
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { handleError } from './utils';

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
