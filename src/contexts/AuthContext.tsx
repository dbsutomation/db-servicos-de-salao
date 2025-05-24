
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
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    currentUser: null
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchUserData = async (userId: string): Promise<boolean> => {
    try {
      console.log("Buscando dados do usuário:", userId);
      
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        return false;
      }
      
      if (!data) {
        console.warn("Usuário não encontrado na tabela professionals:", userId);
        await supabase.auth.signOut();
        return false;
      }
      
      if (!data.has_access) {
        console.warn("Usuário sem permissão de acesso");
        toast({
          title: "Acesso negado",
          description: "Sua conta não tem permissão para acessar o sistema.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        return false;
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
      
      console.log("Usuário autenticado com sucesso:", teamMember.name);
      setAuthState({
        isAuthenticated: true,
        currentUser: teamMember
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao buscar dados do usuário:', error);
      return false;
    }
  };

  useEffect(() => {
    console.log("Inicializando AuthContext...");
    let mounted = true;
    
    const initAuth = async () => {
      try {
        // Verificar sessão atual primeiro
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          if (mounted) setIsLoading(false);
          return;
        }
        
        if (session?.user && mounted) {
          console.log("Sessão existente encontrada:", session.user.email);
          const success = await fetchUserData(session.user.id);
          if (!success && mounted) {
            setAuthState({ isAuthenticated: false, currentUser: null });
          }
        }
        
        if (mounted) setIsLoading(false);
      } catch (error) {
        console.error('Erro na inicialização:', error);
        if (mounted) setIsLoading(false);
      }
    };

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Evento de autenticação:", event);
        
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log("Usuário logado via listener");
          const success = await fetchUserData(session.user.id);
          if (!success) {
            setAuthState({ isAuthenticated: false, currentUser: null });
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("Usuário deslogado");
          setAuthState({ isAuthenticated: false, currentUser: null });
        }
      }
    );

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("Tentativa de login para:", email);
      
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
      
      return false;
    } catch (error: any) {
      console.error("Erro inesperado no login:", error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log("Iniciando logout...");
      
      await supabase.auth.signOut();
      setAuthState({ isAuthenticated: false, currentUser: null });
      
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema.",
      });
      console.log("Logout bem-sucedido");
      navigate('/login');
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

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      login, 
      logout, 
      checkAccess, 
      isLoading 
    }}>
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
