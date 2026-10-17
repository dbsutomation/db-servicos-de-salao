import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from "lucide-react";

export function useIsSystemAdmin() {
  const { isLoading, isAuthenticated, isSystemAdmin } = useAuth();
  return isLoading ? 'loading' : isAuthenticated && isSystemAdmin ? 'ok' : 'denied';
}

export default function AdminGuard({ children }: { children: ReactNode }) {
  const status = useIsSystemAdmin();
  const { isAuthenticated } = useAuth();
  if (status === 'denied') return <Navigate to={isAuthenticated ? '/' : '/login'} replace />;

  if (status !== "ok") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
