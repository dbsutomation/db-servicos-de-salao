
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types';

export async function fetchTeamMembers() {
  const { data, error } = await supabase
    .from('users')
    .select('*');
    
  if (error) {
    throw error;
  }
  
  // Transform to TeamMember interface
  const teamMembers = data.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    profession: user.profession || '',
    phone: user.phone || '',
    password: '', // Não incluímos senha em resultados de consulta
    hasAccess: user.has_access,
    isManager: user.is_manager,
    avatar: user.avatar || ''
  }));
  
  return teamMembers;
}

export async function createTeamMember(member: TeamMember) {
  // Primeiro, criar o usuário na autenticação do Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: member.email,
    password: member.password,
    options: {
      data: {
        name: member.name,
      }
    }
  });
  
  if (authError) {
    throw authError;
  }
  
  // O trigger já vai criar o registro na tabela users,
  // mas precisamos atualizar com os dados adicionais
  const { error: updateError } = await supabase
    .from('users')
    .update({
      name: member.name,
      profession: member.profession,
      phone: member.phone,
      has_access: member.hasAccess,
      is_manager: member.isManager,
      avatar: member.avatar
    })
    .eq('id', authData.user!.id);
    
  if (updateError) {
    throw updateError;
  }
  
  return {
    ...member,
    id: authData.user!.id
  };
}

export async function updateTeamMember(member: TeamMember) {
  const { error } = await supabase
    .from('users')
    .update({
      name: member.name,
      profession: member.profession,
      phone: member.phone,
      has_access: member.hasAccess,
      is_manager: member.isManager,
      avatar: member.avatar
    })
    .eq('id', member.id);
    
  if (error) {
    throw error;
  }
  
  // Se uma nova senha foi fornecida, atualizar no auth
  if (member.password && member.password.trim() !== '') {
    const { error: passwordError } = await supabase.auth.admin.updateUserById(
      member.id,
      { password: member.password }
    );
    
    if (passwordError) {
      throw passwordError;
    }
  }
  
  return member;
}

export async function deleteTeamMember(memberId: string) {
  // Deletar o usuário na auth do Supabase
  // O trigger de delete cascade vai remover o registro na tabela users
  const { error } = await supabase.auth.admin.deleteUser(memberId);
  
  if (error) {
    throw error;
  }
  
  return true;
}
