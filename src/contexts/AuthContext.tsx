
import { createContext, useContext, useState, ReactNode } from 'react';
import { teamMembers } from '@/data/mockData';
import { TeamMember, AuthState } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAccess: (requiredRoutes: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return {
      isAuthenticated: Boolean(savedUser),
      currentUser: savedUser ? JSON.parse(savedUser) : null,
    };
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const login = async (email: string, password: string): Promise<boolean> => {
    // Find user with matching email and password
    const user = teamMembers.find(
      (member) => 
        member.email === email && 
        member.password === password && 
        member.hasLoginAccess !== false
    );

    if (user) {
      const newState = { isAuthenticated: true, currentUser: user };
      setAuthState(newState);
      localStorage.setItem('currentUser', JSON.stringify(user));
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${user.name}!`,
      });
      return true;
    } else {
      toast({
        title: "Falha no login",
        description: "Email ou senha incorretos ou usuário sem permissão de acesso.",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    setAuthState({ isAuthenticated: false, currentUser: null });
    localStorage.removeItem('currentUser');
    navigate('/login');
    toast({
      title: "Logout realizado",
      description: "Você saiu do sistema.",
    });
  };

  const checkAccess = (requiredRoutes: string[]): boolean => {
    // If not authenticated, no access
    if (!authState.isAuthenticated || !authState.currentUser) {
      return false;
    }
    
    // Managers have access to everything
    if (authState.currentUser.isManager) {
      return true;
    }
    
    // Non-managers only have access to specific routes
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
