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
    console.log("Inicializando AuthContext...");
    
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Evento de autenticação:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          console.log("Usuário autenticado encontrado:", newSession.user.email);
          // Buscar informações adicionais do usuário do banco de dados
          setTimeout(async () => {
            try {
              console.log("Buscando dados adicionais do usuário:", newSession.user.id);
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', newSession.user.id)
                .single();
                
              if (error) {
                console.error('Erro ao buscar dados do usuário:', error);
                throw error;
              }
              
              if (data) {
                console.log("Dados do usuário encontrados:", data);
                // Verificar se o usuário tem acesso
                if (!data.has_access) {
                  console.warn("Usuário sem permissão de acesso");
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
                
                console.log("Usuário autenticado com sucesso:", teamMember.name);
                setAuthState({
                  isAuthenticated: true,
                  currentUser: teamMember
                });
              } else {
                console.error("Dados do usuário não encontrados");
              }
            } catch (error) {
              console.error('Erro ao buscar dados do usuário:', error);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          console.log("Nenhum usuário autenticado");
          setAuthState({ isAuthenticated: false, currentUser: null });
          setIsLoading(false);
        }
      }
    );

    // Verificar sessão atual
    const checkSession = async () => {
      try {
        console.log("Verificando sessão existente...");
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          throw error;
        }
        
        if (existingSession) {
          console.log("Sessão existente encontrada:", existingSession.user.email);
          setSession(existingSession);
          setUser(existingSession.user);
        } else {
          console.log("Nenhuma sessão existente encontrada");
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      console.log("Limpando listener de autenticação");
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("Tentativa de login para:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Erro no login:", error);
        toast({
          title: "Falha no login",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
      
      if (data.user) {
        console.log("Login bem-sucedido para:", data.user.email);
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo de volta!",
        });
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error("Erro inesperado no login:", error);
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
      console.log("Iniciando logout...");
      await supabase.auth.signOut();
      setAuthState({ isAuthenticated: false, currentUser: null });
      navigate('/login');
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema.",
      });
      console.log("Logout bem-sucedido");
    } catch (error: any) {
      console.error("Erro no logout:", error);
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
    
    // Não-gerentes têm acesso a rotas específicas
    const allowedRoutes = ['/', '/home', '/clients', '/services', '/cart', '/scheduling'];
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
