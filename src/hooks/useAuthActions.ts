
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AuthState } from '@/types/auth';

export const useAuthActions = (
  authState: AuthState,
  setAuthState: (state: AuthState) => void
) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("Tentando login para:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Erro de login:", error);
        toast({
          title: "Falha no login",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
      
      if (data.user) {
        console.log("Login bem-sucedido para:", data.user.email);
        // Não precisamos fazer mais nada aqui - o useAuthState vai atualizar o contexto
        // e o useEffect no Login.tsx vai cuidar do redirecionamento
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error("Erro no login:", error);
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
      navigate('/login', { replace: true });
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema.",
      });
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error);
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
      console.log("Usuário não autenticado ou sem dados de perfil");
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

  return {
    login,
    logout,
    checkAccess,
    isLoading
  };
};
