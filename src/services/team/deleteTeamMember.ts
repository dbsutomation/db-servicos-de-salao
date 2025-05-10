
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
