
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TeamMember, AuthState } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAccess: (requiredRoutes: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
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
                  profession: '',  // Esses campos não existem na tabela users ainda, 
                  phone: '',       // podemos adicioná-los depois se necessário
                  password: '',
                  hasAccess: data.has_access,
                  isManager: data.is_manager,
                  avatar: ''
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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast({
          title: "Falha no login",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
      
      if (data.user) {
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo de volta!",
        });
        return true;
      }
      
      return false;
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message ?? "Ocorreu um erro inesperado",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setAuthState({ isAuthenticated: false, currentUser: null });
      navigate('/login');
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message ?? "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkAccess = (requiredRoutes: string[]): boolean => {
    // Se não está autenticado, não tem acesso
    if (!authState.isAuthenticated || !authState.currentUser) {
      return false;
    }
    
    // Gerentes têm acesso a tudo
    if (authState.currentUser.isManager) {
      return true;
    }
    
    // Não-gerentes só têm acesso a rotas específicas
    const allowedRoutes = ['/', '/home', '/clients', '/services'];
    return requiredRoutes.some(route => allowedRoutes.includes(route));
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, checkAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
