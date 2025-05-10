
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { TeamMember, AuthState } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuthState = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    currentUser: null
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const { toast } = useToast();

  // Função assíncrona para buscar dados do usuário
  const fetchUserData = async (userId: string) => {
    try {
      console.log("Fetching user data for:", userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        return null;
      }
      
      if (data) {
        console.log("User data fetched successfully:", data);
        
        // Verificar se o usuário tem acesso
        if (!data.has_access) {
          console.log("User does not have access");
          toast({
            title: "Acesso negado",
            description: "Sua conta não tem permissão para acessar o sistema.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setAuthState({ isAuthenticated: false, currentUser: null });
          return null;
        }
        
        // Converter para o formato TeamMember
        const teamMember: TeamMember = {
          id: data.id,
          name: data.name,
          email: data.email,
          profession: data.profession || '',
          phone: data.phone || '',
          password: '',
          hasAccess: data.has_access,
          isManager: data.is_manager,
          avatar: data.avatar || ''
        };
        
        return teamMember;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log("Setting up auth state listener");
    setIsLoading(true);
    
    // Set up auth state listener FIRST to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth event in hook:", event);
        
        // Handle auth state change
        if (newSession?.user) {
          console.log("Auth state changed, user is authenticated:", newSession.user.id);
          // Use setTimeout to prevent recursion
          setTimeout(async () => {
            const teamMember = await fetchUserData(newSession.user.id);
            if (teamMember) {
              console.log("Setting auth state with team member:", teamMember.email);
              setAuthState({
                isAuthenticated: true,
                currentUser: teamMember
              });
            }
            setIsLoading(false);
          }, 0);
        } else {
          console.log("Auth state changed, user is not authenticated");
          setAuthState({ isAuthenticated: false, currentUser: null });
          setIsLoading(false);
        }
      }
    );

    // Check current session
    const checkCurrentSession = async () => {
      try {
        console.log("Checking current session");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userId = session.user.id;
          console.log("Current session exists, user is authenticated:", userId);
          const teamMember = await fetchUserData(userId);
          
          if (teamMember) {
            console.log("Setting auth state with team member from session check:", teamMember.email);
            setAuthState({
              isAuthenticated: true,
              currentUser: teamMember
            });
          }
        } else {
          console.log("No current session, user is not authenticated");
          setAuthState({ isAuthenticated: false, currentUser: null });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        setIsLoading(false);
      }
    };

    checkCurrentSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    authState,
    isLoading,
    setAuthState
  };
};
