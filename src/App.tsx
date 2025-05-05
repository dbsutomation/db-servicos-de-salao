
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Clients from "./pages/Clients";
import Team from "./pages/Team";
import Records from "./pages/Records";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children, requiredRoutes }: { children: JSX.Element, requiredRoutes: string[] }) => {
  const { isAuthenticated, checkAccess } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!checkAccess(requiredRoutes)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

// Auth wrapper that uses the context
const AuthenticatedApp = () => {
  const { isAuthenticated } = useAuth();

  return (
    <CartProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </CartProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthenticatedApp />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
