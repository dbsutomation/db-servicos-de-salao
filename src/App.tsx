
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
import ClientProfile from "./pages/ClientProfile";
import Team from "./pages/Team";
import Cart from "./pages/Cart";
import Expenses from "./pages/Expenses";
import ProfessionalSchedules from "./pages/ProfessionalSchedules";
import Login from "./pages/Login";
import CustomerSignup from "./pages/CustomerSignup";
import CustomerLogin from "./pages/CustomerLogin";
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
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" /> : <Login />
      } />

      {/* Rotas públicas de cliente (não passam pela auth interna) */}
      <Route path="/cadastro-cliente/:salonId" element={<CustomerSignup />} />
      <Route path="/login-cliente" element={<CustomerLogin />} />
      
      <Route path="/" element={
        <CartProvider>
          <ProtectedRoute requiredRoutes={["/"]}>
            <Index />
          </ProtectedRoute>
        </CartProvider>
      } />
      
      <Route path="/services" element={
        <CartProvider>
          <ProtectedRoute requiredRoutes={["/services"]}>
            <Services />
          </ProtectedRoute>
        </CartProvider>
      } />
      
      <Route path="/clients" element={
        <CartProvider>
          <ProtectedRoute requiredRoutes={["/clients"]}>
            <Clients />
          </ProtectedRoute>
        </CartProvider>
      } />

      <Route path="/clients/:id" element={
        <CartProvider>
          <ProtectedRoute requiredRoutes={["/clients"]}>
            <ClientProfile />
          </ProtectedRoute>
        </CartProvider>
      } />
      
      <Route path="/team" element={
        <CartProvider>
          <ProtectedRoute requiredRoutes={["/team"]}>
            <Team />
          </ProtectedRoute>
        </CartProvider>
      } />
      
      <Route path="/cart" element={
        <CartProvider>
          <ProtectedRoute requiredRoutes={["/cart"]}>
            <Cart />
          </ProtectedRoute>
        </CartProvider>
      } />

      <Route path="/expenses" element={
        <CartProvider>
          <ProtectedRoute requiredRoutes={["/expenses"]}>
            <Expenses />
          </ProtectedRoute>
        </CartProvider>
      } />
      
      <Route path="/configurar-horarios" element={
        <CartProvider>
          <ProtectedRoute requiredRoutes={["/configurar-horarios"]}>
            <ProfessionalSchedules />
          </ProtectedRoute>
        </CartProvider>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
