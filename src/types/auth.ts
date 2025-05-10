
import { TeamMember } from '@/types';

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: TeamMember | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAccess: (requiredRoutes: string[]) => boolean;
  isLoading: boolean;
}
