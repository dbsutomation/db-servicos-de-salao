
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
