
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { AuthContextType } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { TeamMember } from '@/types';

// Criar o contexto de autenticação
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider do contexto de autenticação
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  // Buscar dados do usuário completos
  const fetchUserData = async (userId: string): Promise<TeamMember | null> => {
    try {
      console.log("[AuthProvider] Buscando dados do usuário:", userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('[AuthProvider] Erro ao buscar dados do usuário:', error);
        return null;
      }
      
      if (data) {
        console.log("[AuthProvider] Dados do usuário encontrados:", data.email);
        
        // Verificar acesso
        if (!data.has_access) {
          console.log("[AuthProvider] Usuário sem acesso ao sistema");
          toast({
            title: "Acesso negado",
            description: "Sua conta não tem permissão para acessar o sistema.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          return null;
        }
        
        // Converter para TeamMember
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
      console.error('[AuthProvider] Erro ao buscar dados do usuário:', error);
      return null;
    }
  };

  // Funções para login e logout
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("[AuthProvider] Tentando login para:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("[AuthProvider] Erro de login:", error);
        toast({
          title: "Falha no login",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
      
      console.log("[AuthProvider] Login bem-sucedido para:", data.user?.email);
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo de volta!",
      });
      
      return true;
    } catch (error: any) {
      console.error("[AuthProvider] Erro no login:", error);
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
      console.log("[AuthProvider] Realizando logout");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setIsAuthenticated(false);
      setCurrentUser(null);
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema.",
      });
    } catch (error: any) {
      console.error("[AuthProvider] Erro ao fazer logout:", error);
      toast({
        title: "Erro ao sair",
        description: error.message ?? "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar acesso a rotas
  const checkAccess = (requiredRoutes: string[]): boolean => {
    // Se não está autenticado, não tem acesso
    if (!isAuthenticated || !currentUser) {
      console.log("[AuthProvider] Usuário não autenticado ou sem dados de perfil");
      return false;
    }
    
    // Gerentes têm acesso a tudo
    if (currentUser.isManager) {
      return true;
    }
    
    // Não-gerentes só têm acesso a rotas específicas
    const allowedRoutes = ['/', '/home', '/clients', '/services'];
    return requiredRoutes.some(route => allowedRoutes.includes(route));
  };

  // Efeito para verificar sessão e configurar listener de mudanças de autenticação
  useEffect(() => {
    console.log("[AuthProvider] Configurando autenticação");
    const isMounted = { current: true };
    
    // 1. Configurar o listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthProvider] Evento de autenticação:", event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            // Importante: usar setTimeout para evitar loop infinito
            setTimeout(async () => {
              if (!isMounted.current) return;
              
              const userData = await fetchUserData(session.user.id);
              if (userData) {
                setCurrentUser(userData);
                setIsAuthenticated(true);
              } else {
                setCurrentUser(null);
                setIsAuthenticated(false);
              }
              setIsLoading(false);
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    );
    
    // 2. Verificar sessão atual
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log("[AuthProvider] Verificando sessão existente:", session?.user?.email || "Nenhuma");
        
        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          if (userData && isMounted.current) {
            setCurrentUser(userData);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error("[AuthProvider] Erro ao verificar sessão:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Limpar
    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // Log do estado atual
  useEffect(() => {
    console.log("[AuthProvider] Estado de autenticação:", 
      { isAuthenticated, isLoading, user: currentUser?.email || "Nenhum" }
    );
  }, [isAuthenticated, isLoading, currentUser]);

  // Valor do contexto
  const contextValue: AuthContextType = {
    isAuthenticated,
    currentUser,
    isLoading,
    login,
    logout,
    checkAccess
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
