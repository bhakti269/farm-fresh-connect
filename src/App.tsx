import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import FarmerRegister from "./pages/FarmerRegister";
import Sell from "./pages/Sell";
import ConsumerRegister from "./pages/ConsumerRegister";
import FarmerDashboard from "./pages/FarmerDashboard";
import ConsumerDashboard from "./pages/ConsumerDashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Allow farmer-register when coming from Sell flow or from Dashboard "Add Product". */
const FarmerRegisterGate = () => {
  const location = useLocation();
  const state = location.state as { fromSell?: boolean; addProductOnly?: boolean } | null;
  if (!state?.fromSell && !state?.addProductOnly) {
    return <Navigate to="/sell" replace />;
  }
  return <FarmerRegister />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/farmer-register" element={<FarmerRegisterGate />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/consumer-register" element={<ConsumerRegister />} />
            <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
            <Route path="/consumer-dashboard" element={<ConsumerDashboard />} />
            <Route path="/login" element={<Login />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
