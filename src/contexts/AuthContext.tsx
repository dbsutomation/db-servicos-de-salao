
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TeamMember, AuthState } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAccess: (requiredRoutes: string[]) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    currentUser: null
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  
  const { toast } = useToast();

  const fetchUserData = async (userId: string): Promise<TeamMember | null> => {
    try {
      console.log("Buscando dados do usuário:", userId);
      
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        return null;
      }
      
      if (!data) {
        console.warn("Usuário não encontrado na tabela professionals:", userId);
        return null;
      }
      
      if (!data.has_access) {
        console.warn("Usuário sem permissão de acesso");
        toast({
          title: "Acesso negado",
          description: "Sua conta não tem permissão para acessar o sistema.",
          variant: "destructive",
        });
        return null;
      }
      
      const teamMember: TeamMember = {
        id: data.id,
        name: data.name,
        email: data.email,
        profession: data.profession || '',
        phone: data.phone || '',
        password: '',
        hasAccess: data.has_access,
        isManager: data.is_manager,
        avatar: data.avatar || '',
        categories: data.categories || []
      };
      
      console.log("Dados do usuário carregados:", teamMember.name);
      return teamMember;
    } catch (error: any) {
      console.error('Erro ao buscar dados do usuário:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log("AuthProvider: Inicializando contexto...");
    
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log("AuthProvider: Verificando sessão inicial...");
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          if (mounted) {
            setSession(null);
            setAuthState({ isAuthenticated: false, currentUser: null });
            setIsLoading(false);
          }
          return;
        }
        
        if (session?.user && mounted) {
          console.log("AuthProvider: Sessão encontrada:", session.user.email);
          setSession(session);
          
          const userData = await fetchUserData(session.user.id);
          
          if (userData && mounted) {
            setAuthState({ isAuthenticated: true, currentUser: userData });
          } else if (mounted) {
            setSession(null);
            setAuthState({ isAuthenticated: false, currentUser: null });
            await supabase.auth.signOut();
          }
        } else if (mounted) {
          setSession(null);
          setAuthState({ isAuthenticated: false, currentUser: null });
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erro na inicialização da auth:', error);
        if (mounted) {
          setSession(null);
          setAuthState({ isAuthenticated: false, currentUser: null });
          setIsLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("AuthProvider: Evento de auth:", event, session?.user?.email);
        
        if (!mounted) return;
        
        setSession(session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log("AuthProvider: Usuário logado");
          const userData = await fetchUserData(session.user.id);
          
          if (userData && mounted) {
            setAuthState({ isAuthenticated: true, currentUser: userData });
          } else if (mounted) {
            setAuthState({ isAuthenticated: false, currentUser: null });
          }
        } else if (event === 'SIGNED_OUT' && mounted) {
          console.log("AuthProvider: Usuário deslogado");
          setAuthState({ isAuthenticated: false, currentUser: null });
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      }
    );

    initAuth();

    return () => {
      console.log("AuthProvider: Cleanup");
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Tentativa de login para:", email);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });
      
      if (error) {
        console.error("Erro no login:", error);
        let errorMessage = "Ocorreu um erro no login";
        
        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = "Email ou senha incorretos";
            break;
          case 'Email not confirmed':
            errorMessage = "Email não confirmado. Verifique sua caixa de entrada";
            break;
          case 'Too many requests':
            errorMessage = "Muitas tentativas. Aguarde alguns minutos";
            break;
          default:
            errorMessage = error.message;
        }
        
        toast({
          title: "Falha no login",
          description: errorMessage,
          variant: "destructive",
        });
        
        setIsLoading(false);
        return false;
      }
      
      if (data.user) {
        console.log("Login bem-sucedido");
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo de volta!",
        });
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error: any) {
      console.error("Erro inesperado no login:", error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log("Iniciando logout...");
      await supabase.auth.signOut();
      setSession(null);
      setAuthState({ isAuthenticated: false, currentUser: null });
      
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema.",
      });
    } catch (error: any) {
      console.error("Erro no logout:", error);
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro inesperado ao sair.",
        variant: "destructive",
      });
    }
  };

  const checkAccess = (requiredRoutes: string[]): boolean => {
    if (!authState.isAuthenticated || !authState.currentUser) {
      return false;
    }
    
    if (authState.currentUser.isManager) {
      return true;
    }
    
    const allowedRoutes = ['/', '/home', '/clients', '/services', '/cart', '/scheduling'];
    return requiredRoutes.some(route => allowedRoutes.includes(route));
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    checkAccess,
    isLoading
  };

  console.log("AuthProvider: Renderizando com estado:", { 
    isAuthenticated: authState.isAuthenticated, 
    isLoading,
    hasUser: !!authState.currentUser,
    hasSession: !!session
  });

  return (
    <AuthContext.Provider value={contextValue}>
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
