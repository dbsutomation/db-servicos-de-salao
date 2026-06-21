
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types';
import { toast } from '@/hooks/use-toast';
import { toTitleCase, normalizePhone } from '@/lib/formatters';

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
      phone: user.phone || '',
      profession: user.profession || '',
      password: '',
      avatar: user.avatar || '/placeholder.svg',
      categories: user.categories || []
    }));
    
    return transformedData;
  } catch (error: any) {
    console.error('Error fetching users:', error);
    toast({
      title: "Erro ao carregar profissionais",
      description: error.message || "Não foi possível carregar os profissionais",
      variant: "destructive"
    });
    return [];
  }
};

export const updateTeamMember = async (memberId: string, data: any): Promise<boolean> => {
  try {
    if (!memberId) {
      throw new Error("ID do profissional não fornecido para atualização");
    }
    
    console.log("Atualizando profissional com ID:", memberId);
    console.log("Dados para atualização:", data);
    
    const updateData = {
      name: toTitleCase(data.name),
      email: data.email,
      phone: data.phone ? normalizePhone(data.phone) : null,
      profession: data.profession || null,
      has_access: data.hasAccess,
      is_manager: data.isManager,
      categories: data.categories || []
    };
    
    const { data: existingMember, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', memberId)
      .single();
      
    if (checkError) {
      console.error("Erro ao verificar profissional existente:", checkError);
      throw new Error("Profissional não encontrado");
    }
    
    if (!existingMember) {
      throw new Error("Profissional não encontrado para atualização");
    }
    
    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', memberId);
      
    if (error) {
      console.error("Erro na operação de atualização:", error);
      throw error;
    }
    
    console.log("Profissional atualizado com sucesso:", memberId);
    
    toast({
      title: "Profissional atualizado",
      description: `${data.name} foi atualizado com sucesso.`,
      duration: 5000,
    });
    
    return true;
  } catch (error: any) {
    console.error("Erro completo na atualização:", error);
    handleError(error, "ao atualizar o profissional");
    return false;
  }
};

export const createTeamMember = async (data: any): Promise<boolean> => {
  try {
    console.log("Criando novo profissional com dados:", data);
    
    const id = crypto.randomUUID();
    
    const salonId = await getCurrentSalonId();
    const insertData = {
      id: id,
      name: toTitleCase(data.name),
      email: data.email,
      phone: data.phone ? normalizePhone(data.phone) : null,
      profession: data.profession || null,
      has_access: data.hasAccess,
      is_manager: data.isManager,
      categories: data.categories || [],
      salon_id: salonId,
    };
    
    const { data: newMember, error } = await supabase
      .from('users')
      .insert(insertData as any)
      .select();
      
      
    if (error) {
      console.error("Erro na operação de inserção:", error);
      throw error;
    }
    
    console.log("Novo profissional criado:", newMember);
    
    toast({
      title: "Profissional adicionado",
      description: `${data.name} foi adicionado com sucesso.`
    });
    
    return true;
  } catch (error: any) {
    console.error("Erro completo na criação:", error);
    handleError(error, "ao salvar o profissional");
    return false;
  }
};

export const deleteTeamMember = async (memberId: string, memberName?: string): Promise<boolean> => {
  try {
    if (!memberId) {
      throw new Error("ID do profissional não fornecido para exclusão");
    }
    
    console.log("Excluindo profissional com ID:", memberId);
    
    const { data: existingMember, error: checkError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', memberId)
      .single();
      
    if (checkError) {
      console.error("Erro ao verificar profissional existente:", checkError);
      throw new Error("Profissional não encontrado");
    }
    
    if (!existingMember) {
      throw new Error("Profissional não encontrado para exclusão");
    }
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', memberId);
      
    if (error) {
      console.error("Erro na operação de exclusão:", error);
      throw error;
    }
    
    console.log("Profissional excluído com sucesso:", memberId);
    
    if (memberName) {
      toast({
        title: "Profissional removido",
        description: `${memberName} foi removido com sucesso.`
      });
    }
    
    return true;
  } catch (error: any) {
    console.error("Erro completo na exclusão:", error);
    let errorMessage = error.message || "Ocorreu um erro ao excluir o profissional";
    
    if (error.code === '23503') {
      errorMessage = "Este profissional não pode ser excluído pois possui registros associados";
    }
    
    toast({
      title: "Erro",
      description: errorMessage,
      variant: "destructive"
    });
    return false;
  }
};

const handleError = (error: any, action: string): void => {
  let errorMessage = error.message || `Ocorreu um erro ${action}`;
  
  if (error.code === '23505') {
    errorMessage = "Este email já está em uso por outro profissional";
  } else if (error.code === '23514') {
    errorMessage = "Os dados fornecidos não atendem às restrições do banco de dados";
  }
  
  console.error("Erro detalhado:", error);
  
  toast({
    title: "Erro",
    description: errorMessage,
    variant: "destructive"
  });
};
