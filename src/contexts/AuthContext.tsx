import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TeamMember, AuthState } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { clearSalonCache } from '@/lib/salon';
import { canEnterOperationalPages, loginDestination } from '@/lib/loginAccess';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAccess: (requiredRoutes: string[]) => boolean;
  isLoading: boolean;
  isSystemAdmin: boolean;
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
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          setIsLoading(true);
          // Buscar informações adicionais do usuário do banco de dados
          setTimeout(async () => {
            try {
              // Resolve platform administration before any operational profile.
              const { data: adminRow, error: adminError } = await supabase
                .from('system_admins')
                .select('user_id')
                .eq('user_id', newSession.user.id)
                .maybeSingle();
              if (adminError) throw adminError;
              setIsSystemAdmin(Boolean(adminRow));
              if (adminRow) {
                clearSalonCache();
                setAuthState({ isAuthenticated: true, currentUser: null });
                if (!window.location.pathname.startsWith('/admin/') || window.location.pathname === '/admin/login') {
                  navigate(loginDestination(true), { replace: true });
                }
                return;
              }
              const { data, error } = await supabase
                .from('users')
                .select('*, salon_id')
                .eq('id', newSession.user.id)
                .maybeSingle();

              if (error) {
                throw error;
              }

              if (!data) {
                toast({
                  title: "Conta sem acesso",
                  description: "Esta conta não está vinculada a nenhum estabelecimento.",
                  variant: "destructive",
                });
                await supabase.auth.signOut();
                setAuthState({ isAuthenticated: false, currentUser: null });
                navigate('/login');
                return;
              }

              if (data) {
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
                const salonId = (data as any).salon_id || '';
                
                // Buscar nome e situação do salão
                let salonName = '';
                let salonLogo = '';
                let salonFeatures = { expenses: false, agenda: false, workHours: false };
                if (salonId) {
                  const { data: salonData } = await supabase
                    .from('salons' as any)
                    .select('name, status, logo_url, feature_expenses, feature_agenda, feature_work_hours')
                    .eq('id', salonId)
                    .single();
                  salonName = (salonData as any)?.name || '';
                  salonLogo = (salonData as any)?.logo_url || '';
                  salonFeatures = {
                    expenses: (salonData as any)?.feature_expenses === true,
                    agenda: (salonData as any)?.feature_agenda === true,
                    workHours: (salonData as any)?.feature_agenda === true && (salonData as any)?.feature_work_hours === true,
                  };

                  const salonStatus = (salonData as any)?.status;
                  if (salonStatus && salonStatus !== 'ativo') {
                    toast({
                      title: "Acesso suspenso",
                      description: "O acesso deste estabelecimento está suspenso. Fale com o administrador da plataforma.",
                      variant: "destructive",
                    });
                    await supabase.auth.signOut();
                    setAuthState({ isAuthenticated: false, currentUser: null });
                    navigate('/login');
                    return;
                  }
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
                  categories: (data as any).categories || [],
                  salonId,
                  salonName,
                  features: salonFeatures,
                };
                
                setAuthState({
                  isAuthenticated: true,
                  currentUser: teamMember
                });
                if (window.location.pathname === '/login') navigate(loginDestination(false), { replace: true });
              }
            } catch (error) {
              setIsSystemAdmin(false);
              setAuthState({ isAuthenticated: false, currentUser: null });
              console.error('Erro ao carregar usuário:', error);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          setIsSystemAdmin(false);
          setAuthState({ isAuthenticated: false, currentUser: null });
          setIsLoading(false);
        }
      }
    );

    // Verificar sessão atual
    const checkSession = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
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
        setIsLoading(false);
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
      setIsLoading(false);
      toast({
        title: "Erro no login",
        description: error.message ?? "Ocorreu um erro inesperado",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      clearSalonCache();
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
    if (!canEnterOperationalPages(authState.isAuthenticated, isSystemAdmin, Boolean(authState.currentUser)) || !authState.currentUser) {
      return false;
    }
    const features = authState.currentUser.features;
    if (requiredRoutes.some(route => route === '/expenses' && !features?.expenses || route === '/agenda' && !features?.agenda || route === '/configurar-horarios' && !features?.workHours)) return false;
    
    // Gerentes têm acesso a tudo
    if (authState.currentUser.isManager) {
      return true;
    }
    
    // Não-gerentes têm acesso a rotas específicas
    const allowedRoutes = ['/', '/home', '/clients', '/services', '/cart', '/scheduling', '/configurar-horarios', '/minha-agenda', '/agenda'];
    return requiredRoutes.some(route => allowedRoutes.includes(route));
  };

  return (
    <AuthContext.Provider value={{ ...authState, isSystemAdmin, isLoading, login, logout, checkAccess }}>
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
