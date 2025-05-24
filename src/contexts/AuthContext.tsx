
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Função melhorada para testar conectividade
  const testSupabaseConnection = async (): Promise<boolean> => {
    try {
      console.log("Testando conexão com Supabase...");
      const { data, error } = await supabase
        .from('professionals')
        .select('count')
        .limit(1);
        
      if (error) {
        console.error('Erro de conectividade:', error);
        return false;
      }
      
      console.log("Conexão com Supabase OK");
      return true;
    } catch (error) {
      console.error('Falha na conectividade:', error);
      return false;
    }
  };

  const fetchUserData = async (userId: string): Promise<boolean> => {
    try {
      console.log("Buscando dados do usuário:", userId);
      
      // Testar conectividade primeiro
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        toast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
          variant: "destructive",
        });
        return false;
      }
      
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        toast({
          title: "Erro ao carregar perfil",
          description: "Não foi possível carregar seus dados. Tente novamente.",
          variant: "destructive",
        });
        return false;
      }
      
      if (!data) {
        console.warn("Usuário não encontrado na tabela professionals:", userId);
        toast({
          title: "Usuário não encontrado",
          description: "Seu perfil não foi encontrado no sistema. Entre em contato com o administrador.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        return false;
      }
      
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
        return false;
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
      toast({
        title: "Erro ao carregar perfil",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    console.log("Inicializando AuthContext...");
    
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Evento de autenticação:", event, newSession?.user?.email);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_IN' && newSession?.user) {
          console.log("Usuário logado, buscando dados...");
          const success = await fetchUserData(newSession.user.id);
          if (!success) {
            setAuthState({ isAuthenticated: false, currentUser: null });
            setUser(null);
            setSession(null);
            navigate('/login');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("Usuário deslogado");
          setAuthState({ isAuthenticated: false, currentUser: null });
        }
        
        setIsLoading(false);
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
        
        if (existingSession?.user) {
          console.log("Sessão existente encontrada:", existingSession.user.email);
          setSession(existingSession);
          setUser(existingSession.user);
          
          const success = await fetchUserData(existingSession.user.id);
          if (!success) {
            setAuthState({ isAuthenticated: false, currentUser: null });
            setUser(null);
            setSession(null);
          }
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
      
      // Testar conectividade primeiro
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        toast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
          variant: "destructive",
        });
        return false;
      }
      
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
      setIsLoading(true);
      console.log("Iniciando logout...");
      
      await supabase.auth.signOut();
      setAuthState({ isAuthenticated: false, currentUser: null });
      setUser(null);
      setSession(null);
      
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
