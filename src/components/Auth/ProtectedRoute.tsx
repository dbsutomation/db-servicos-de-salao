
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRoutes: string[];
}

export const ProtectedRoute = ({ children, requiredRoutes }: ProtectedRouteProps) => {
  const { isAuthenticated, checkAccess, isLoading } = useAuth();
  
  console.log("ProtectedRoute - Estado:", { isAuthenticated, isLoading });
  
  if (isLoading) {
    return null;
  }
  
  if (!isAuthenticated) {
    console.log("ProtectedRoute - Redirecionando para login");
    return <Navigate to="/login" replace />;
  }
  
  if (!checkAccess(requiredRoutes)) {
    console.log("ProtectedRoute - Sem acesso, redirecionando para home");
    return <Navigate to="/" replace />;
  }
  
  return children;
};
