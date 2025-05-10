
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types';

// Fetch all team members from the users table
export const fetchTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) throw error;

    return data.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      profession: user.profession || '',
      phone: user.phone || '',
      password: '', // We don't store or receive password from DB for security
      hasAccess: user.has_access,
      isManager: user.is_manager,
      avatar: user.avatar || ''
    }));
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
};

// Create a new user with authentication and in users table
export const createTeamMember = async (teamMember: Omit<TeamMember, 'id'>): Promise<string> => {
  try {
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: teamMember.email,
      password: teamMember.password,
      email_confirm: true, // Auto confirm the email
      user_metadata: { name: teamMember.name }
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // Then update the users table with additional fields
    // The trigger will automatically create a record, but we need to update it
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name: teamMember.name,
        email: teamMember.email,
        phone: teamMember.phone,
        profession: teamMember.profession,
        has_access: teamMember.hasAccess,
        is_manager: teamMember.isManager,
        avatar: teamMember.avatar
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return userId;
  } catch (error) {
    console.error('Error creating team member:', error);
    throw error;
  }
};

// Update an existing team member
export const updateTeamMember = async (teamMember: TeamMember): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        name: teamMember.name,
        email: teamMember.email,
        phone: teamMember.phone,
        profession: teamMember.profession,
        has_access: teamMember.hasAccess,
        is_manager: teamMember.isManager,
        avatar: teamMember.avatar
      })
      .eq('id', teamMember.id);

    if (error) throw error;
    
    // If password was provided, update it in auth
    if (teamMember.password) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        teamMember.id,
        { password: teamMember.password }
      );
      
      if (authError) throw authError;
    }
  } catch (error) {
    console.error('Error updating team member:', error);
    throw error;
  }
};

// Delete a team member
export const deleteTeamMember = async (id: string): Promise<void> => {
  try {
    // When you delete the auth user, the trigger will automatically
    // delete the record from users table if you set up cascading deletes
    const { error } = await supabase.auth.admin.deleteUser(id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting team member:', error);
    throw error;
  }
};
