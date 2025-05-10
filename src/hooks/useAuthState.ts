
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

  useEffect(() => {
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Buscar informações adicionais do usuário do banco de dados
          setTimeout(async () => {
            try {
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
                
              if (error) throw error;
              
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
                  return;
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
                
                setAuthState({
                  isAuthenticated: true,
                  currentUser: teamMember
                });
              }
            } catch (error) {
              console.error('Erro ao buscar dados do usuário:', error);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          setAuthState({ isAuthenticated: false, currentUser: null });
          setIsLoading(false);
        }
      }
    );

    // Verificar sessão atual
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          setSession(session);
          setUser(session.user);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
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
