
import { useState, useEffect, useRef } from 'react';
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
  const isMounted = useRef<boolean>(true);
  
  const { toast } = useToast();

  // Função para buscar dados do usuário
  const fetchUserData = async (userId: string) => {
    try {
      console.log("[useAuthState] Fetching user data for:", userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('[useAuthState] Erro ao buscar dados do usuário:', error);
        
        if (isMounted.current) {
          setIsLoading(false);
        }
        return null;
      }
      
      if (data) {
        console.log("[useAuthState] User data fetched successfully:", data);
        
        // Verificar se o usuário tem acesso
        if (!data.has_access) {
          console.log("[useAuthState] User does not have access");
          toast({
            title: "Acesso negado",
            description: "Sua conta não tem permissão para acessar o sistema.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          
          if (isMounted.current) {
            setAuthState({ isAuthenticated: false, currentUser: null });
            setIsLoading(false);
          }
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
      console.error('[useAuthState] Erro ao buscar dados do usuário:', error);
      
      if (isMounted.current) {
        setIsLoading(false);
      }
      return null;
    }
  };

  useEffect(() => {
    isMounted.current = true;
    console.log("[useAuthState] Setting up auth state listener");
    setIsLoading(true);
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("[useAuthState] Auth event in hook:", event);
        
        if (!isMounted.current) return;
        
        // Handle auth state change
        if (newSession?.user) {
          console.log("[useAuthState] Auth state changed, user is authenticated:", newSession.user.id);
          
          // Fetch user data, but don't call any Supabase functions inside the callback
          const userId = newSession.user.id;
          setTimeout(async () => {
            if (!isMounted.current) return;
            
            const teamMember = await fetchUserData(userId);
            if (teamMember && isMounted.current) {
              console.log("[useAuthState] Setting auth state with team member:", teamMember.email);
              setAuthState({
                isAuthenticated: true,
                currentUser: teamMember
              });
            } else if (isMounted.current) {
              setAuthState({ isAuthenticated: false, currentUser: null });
            }
            if (isMounted.current) setIsLoading(false);
          }, 10);
        } else {
          console.log("[useAuthState] Auth state changed, user is not authenticated");
          if (isMounted.current) {
            setAuthState({ isAuthenticated: false, currentUser: null });
            setIsLoading(false);
          }
        }
      }
    );

    // Check current session
    const checkCurrentSession = async () => {
      try {
        console.log("[useAuthState] Checking current session");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && isMounted.current) {
          const userId = session.user.id;
          console.log("[useAuthState] Current session exists, user is authenticated:", userId);
          
          const teamMember = await fetchUserData(userId);
          if (teamMember && isMounted.current) {
            console.log("[useAuthState] Setting auth state with team member from session check:", teamMember.email);
            setAuthState({
              isAuthenticated: true,
              currentUser: teamMember
            });
          }
        } else if (isMounted.current) {
          console.log("[useAuthState] No current session, user is not authenticated");
          setAuthState({ isAuthenticated: false, currentUser: null });
        }
        
        if (isMounted.current) setIsLoading(false);
      } catch (error) {
        console.error('[useAuthState] Erro ao verificar sessão:', error);
        if (isMounted.current) setIsLoading(false);
      }
    };

    // Call after setting up the listener
    checkCurrentSession();

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    authState,
    isLoading,
    setAuthState
  };
};
