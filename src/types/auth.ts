
import { TeamMember } from '@/types';

export interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: TeamMember | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAccess: (requiredRoutes: string[]) => boolean;
}
