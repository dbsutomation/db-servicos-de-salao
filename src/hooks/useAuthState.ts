
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { TeamMember, AuthState } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useAuthState = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    currentUser: null
  });
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Função assíncrona para buscar dados do usuário
  const fetchUserData = async (userId: string) => {
    try {
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
        // Verificar se o usuário tem acesso
        if (!data.has_access) {
          toast({
            title: "Acesso negado",
            description: "Sua conta não tem permissão para acessar o sistema.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setAuthState({ isAuthenticated: false, currentUser: null });
          navigate('/login');
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
    // Função para atualizar o estado de autenticação
    const updateAuthState = async (currentSession: Session | null) => {
      if (currentSession?.user) {
        // Buscar informações adicionais do usuário
        const teamMember = await fetchUserData(currentSession.user.id);
        
        if (teamMember) {
          setAuthState({
            isAuthenticated: true,
            currentUser: teamMember
          });
        } else {
          setAuthState({
            isAuthenticated: true, // Ainda autenticado, mas sem dados completos
            currentUser: null
          });
        }
      } else {
        setAuthState({ isAuthenticated: false, currentUser: null });
      }
      setIsLoading(false);
    };

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth event:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Usa setTimeout para evitar problemas de recursão
        setTimeout(() => {
          updateAuthState(newSession);
        }, 0);
      }
    );

    // Verificar sessão atual
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        await updateAuthState(currentSession);
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return {
    authState,
    isLoading,
    setAuthState
  };
};
