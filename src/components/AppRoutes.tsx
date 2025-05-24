
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "./Auth/ProtectedRoute";
import Index from "@/pages/Index";
import Services from "@/pages/Services";
import Clients from "@/pages/Clients";
import Team from "@/pages/Team";
import Records from "@/pages/Records";
import Cart from "@/pages/Cart";
import Scheduling from "@/pages/Scheduling";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

export const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-salon-light-purple to-white">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-salon-purple" />
          <p className="text-salon-purple">Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  
  return (
    <CartProvider>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/" element={
          <ProtectedRoute requiredRoutes={["/"]}>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/services" element={
          <ProtectedRoute requiredRoutes={["/services"]}>
            <Services />
          </ProtectedRoute>
        } />
        <Route path="/clients" element={
          <ProtectedRoute requiredRoutes={["/clients"]}>
            <Clients />
          </ProtectedRoute>
        } />
        <Route path="/team" element={
          <ProtectedRoute requiredRoutes={["/team"]}>
            <Team />
          </ProtectedRoute>
        } />
        <Route path="/records" element={
          <ProtectedRoute requiredRoutes={["/records"]}>
            <Records />
          </ProtectedRoute>
        } />
        <Route path="/cart" element={
          <ProtectedRoute requiredRoutes={["/cart"]}>
            <Cart />
          </ProtectedRoute>
        } />
        <Route path="/scheduling" element={
          <ProtectedRoute requiredRoutes={["/scheduling"]}>
            <Scheduling />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </CartProvider>
  );
};
