
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRoutes: string[];
}

export const ProtectedRoute = ({ children, requiredRoutes }: ProtectedRouteProps) => {
  const { isAuthenticated, checkAccess } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!checkAccess(requiredRoutes)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};
