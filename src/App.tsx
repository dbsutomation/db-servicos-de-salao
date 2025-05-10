
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

// Protected route component
const ProtectedRoute = ({ children, requiredRoutes }: { children: JSX.Element, requiredRoutes: string[] }) => {
  const { isAuthenticated, checkAccess, isLoading } = useAuth();
  
  console.log("ProtectedRoute: isAuthenticated =", isAuthenticated, "isLoading =", isLoading);
  
  // Enquanto carrega, não redireciona ainda
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }
  
  if (!isAuthenticated) {
    console.log("Usuário não autenticado, redirecionando para login");
    return <Navigate to="/login" replace />;
  }
  
  if (!checkAccess(requiredRoutes)) {
    console.log("Usuário sem acesso a rota", requiredRoutes);
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Auth wrapper that uses the context
const AuthenticatedApp = () => {
  const { isAuthenticated, isLoading } = useAuth();
  console.log("AuthenticatedApp: isAuthenticated =", isAuthenticated, "isLoading =", isLoading);

  // Enquanto carrega, mostra indicador de carregamento
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

  return (
    <CartProvider>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } />
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
