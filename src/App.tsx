import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Customer Pages
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerSignup from "./pages/customer/CustomerSignup";
import ForgotPassword from "./pages/customer/ForgotPassword";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import FindMechanic from "./pages/customer/FindMechanic";

// Mechanic Pages
import MechanicRegister from "./pages/mechanic/MechanicRegister";
import MechanicLogin from "./pages/mechanic/MechanicLogin";
import ShopDetails from "./pages/mechanic/ShopDetails";
import ServicesOffered from "./pages/mechanic/ServicesOffered";
import MechanicDashboard from "./pages/mechanic/MechanicDashboard";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      
      {/* Customer Auth Routes */}
      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route path="/customer/signup" element={<CustomerSignup />} />
      <Route path="/customer/forgot-password" element={<ForgotPassword />} />
      
      {/* Customer Protected Routes */}
      <Route path="/customer/dashboard" element={
        <ProtectedRoute>
          <CustomerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/customer/find-mechanic" element={
        <ProtectedRoute>
          <FindMechanic />
        </ProtectedRoute>
      } />
      
      {/* Mechanic Auth Routes */}
      <Route path="/mechanic/register" element={<MechanicRegister />} />
      <Route path="/mechanic/login" element={<MechanicLogin />} />
      <Route path="/mechanic/shop-details" element={
        <ProtectedRoute>
          <ShopDetails />
        </ProtectedRoute>
      } />
      <Route path="/mechanic/services" element={
        <ProtectedRoute>
          <ServicesOffered />
        </ProtectedRoute>
      } />
      
      {/* Mechanic Protected Routes */}
      <Route path="/mechanic/dashboard" element={
        <ProtectedRoute>
          <MechanicDashboard />
        </ProtectedRoute>
      } />
      <Route path="/mechanic/forgot-password" element={<ForgotPassword />} />
      
      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
