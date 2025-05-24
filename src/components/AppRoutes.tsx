
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
  
  console.log("AppRoutes - isAuthenticated:", isAuthenticated, "isLoading:", isLoading);
  
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
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} 
      />
      <Route path="/" element={
        <ProtectedRoute requiredRoutes={["/"]}>
          <CartProvider>
            <Index />
          </CartProvider>
        </ProtectedRoute>
      } />
      <Route path="/services" element={
        <ProtectedRoute requiredRoutes={["/services"]}>
          <CartProvider>
            <Services />
          </CartProvider>
        </ProtectedRoute>
      } />
      <Route path="/clients" element={
        <ProtectedRoute requiredRoutes={["/clients"]}>
          <CartProvider>
            <Clients />
          </CartProvider>
        </ProtectedRoute>
      } />
      <Route path="/team" element={
        <ProtectedRoute requiredRoutes={["/team"]}>
          <CartProvider>
            <Team />
          </CartProvider>
        </ProtectedRoute>
      } />
      <Route path="/records" element={
        <ProtectedRoute requiredRoutes={["/records"]}>
          <CartProvider>
            <Records />
          </CartProvider>
        </ProtectedRoute>
      } />
      <Route path="/cart" element={
        <ProtectedRoute requiredRoutes={["/cart"]}>
          <CartProvider>
            <Cart />
          </CartProvider>
        </ProtectedRoute>
      } />
      <Route path="/scheduling" element={
        <ProtectedRoute requiredRoutes={["/scheduling"]}>
          <CartProvider>
            <Scheduling />
          </CartProvider>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
