
import { createContext, useContext, ReactNode, useEffect } from 'react';
import { AuthContextType } from '@/types/auth';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/hooks/useAuthActions';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { authState, setAuthState, isLoading } = useAuthState();
  const { login, logout, checkAccess, isLoading: actionsLoading } = useAuthActions(authState, setAuthState);

  const isAuthLoading = isLoading || actionsLoading;

  // Log do estado de autenticação quando muda
  useEffect(() => {
    console.log("AuthContext atualizado:", { 
      isAuthenticated: authState.isAuthenticated, 
      user: authState.currentUser?.email,
      isLoading: isAuthLoading 
    });
  }, [authState, isAuthLoading]);

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      login, 
      logout, 
      checkAccess,
      isLoading: isAuthLoading
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
