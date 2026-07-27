import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import Auth from '@/pages/Auth';
import Builder from '@/pages/Builder';
import Dashboard from '@/pages/Dashboard';
import Landing from '@/pages/Landing';
import NotFound from '@/pages/NotFound';
import { Store } from '@/config/redux/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Provider } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const queryClient = new QueryClient();

export function App() {
  return (
    <Provider store={Store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/builder"
                    element={
                      <ProtectedRoute>
                        <Builder />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
