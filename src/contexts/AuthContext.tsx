
import { createContext, useContext, ReactNode, useEffect } from 'react';
import { AuthContextType } from '@/types/auth';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/hooks/useAuthActions';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { authState, setAuthState, isLoading } = useAuthState();
  const { login, logout, checkAccess } = useAuthActions(authState, setAuthState);

  // Log do estado de autenticação quando muda
  useEffect(() => {
    console.log("AuthContext atualizado:", { 
      isAuthenticated: authState.isAuthenticated, 
      user: authState.currentUser?.email,
      isLoading 
    });
  }, [authState, isLoading]);

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
