
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

  // Função para buscar dados do usuário
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
        setIsLoading(false);
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
          setIsLoading(false);
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
      setIsLoading(false);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log("Setting up auth state listener");
    setIsLoading(true);
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth event in hook:", event);
        
        if (!mounted) return;
        
        // Handle auth state change
        if (newSession?.user) {
          console.log("Auth state changed, user is authenticated:", newSession.user.id);
          
          // Fetch user data, but don't call any Supabase functions inside the callback
          const userId = newSession.user.id;
          setTimeout(async () => {
            if (!mounted) return;
            
            const teamMember = await fetchUserData(userId);
            if (teamMember && mounted) {
              console.log("Setting auth state with team member:", teamMember.email);
              setAuthState({
                isAuthenticated: true,
                currentUser: teamMember
              });
            } else if (mounted) {
              setAuthState({ isAuthenticated: false, currentUser: null });
            }
            if (mounted) setIsLoading(false);
          }, 0);
        } else {
          console.log("Auth state changed, user is not authenticated");
          if (mounted) {
            setAuthState({ isAuthenticated: false, currentUser: null });
            setIsLoading(false);
          }
        }
      }
    );

    // Check current session
    const checkCurrentSession = async () => {
      try {
        console.log("Checking current session");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          const userId = session.user.id;
          console.log("Current session exists, user is authenticated:", userId);
          
          const teamMember = await fetchUserData(userId);
          if (teamMember && mounted) {
            console.log("Setting auth state with team member from session check:", teamMember.email);
            setAuthState({
              isAuthenticated: true,
              currentUser: teamMember
            });
          }
        } else if (mounted) {
          console.log("No current session, user is not authenticated");
          setAuthState({ isAuthenticated: false, currentUser: null });
        }
        
        if (mounted) setIsLoading(false);
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        if (mounted) setIsLoading(false);
      }
    };

    // Call after setting up the listener
    checkCurrentSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    authState,
    isLoading,
    setAuthState
  };
};
