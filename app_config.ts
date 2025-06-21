// app/providers.tsx
import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/shared/components/theme-provider';
import { ErrorFallback } from '@/shared/components/error-fallback';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ThemeProvider defaultTheme="dark" storageKey="omnisent-theme">
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            {children}
            <Toaster
              position="top-right"
              theme="dark"
              toastOptions={{
                style: {
                  background: 'rgb(30 41 59)',
                  border: '1px solid rgb(51 65 85)',
                  color: 'rgb(226 232 240)',
                },
              }}
            />
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

// app/router.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';

// Lazy load pages
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const FilesPage = lazy(() => import('@/pages/files/FilesPage'));
const NotesPage = lazy(() => import('@/pages/notes/NotesPage'));
const SearchPage = lazy(() => import('@/pages/search/SearchPage'));
const AIPage = lazy(() => import('@/pages/ai/AIPage'));
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));

export const AppRouter = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/auth/login" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <LoginPage />
          </Suspense>
        } 
      />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/files/*" element={<FilesPage />} />
                  <Route path="/notes/*" element={<NotesPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/ai/*" element={<AIPage />} />
                  
                  {/* Admin routes */}
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings/*"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Catch all */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

// app/App.tsx
import { useEffect } from 'react';
import { Providers } from './providers';
import { AppRouter } from './router';
import { useAuthStore } from '@/entities/auth';
import { useSystemMonitor } from '@/shared/hooks/useSystemMonitor';

export const App = () => {
  const { refreshSession } = useAuthStore();
  
  // Initialize auth on app start
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Start system monitoring
  useSystemMonitor();

  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
};

// shared/components/ProtectedRoute.tsx
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/entities/auth';
import { LoadingSpinner } from './LoadingSpinner';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Shield, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-slate-900/50 border-slate-700 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          
          <h2 className="text-xl font-semibold text-slate-200 mb-2">
            Access Denied
          </h2>
          
          <p className="text-slate-400 mb-6">
            You don't have permission to access this page. Required role: {requiredRole}
          </p>
          
          <div className="space-y-3">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400">Current user:</p>
              <p className="font-medium text-slate-200">{user?.username}</p>
              <p className="text-sm text-slate-400">Role: {user?.role}</p>
            </div>
            
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

// shared/components/LoadingSpinner.tsx
import { motion } from 'framer-motion';

export const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
          className="w-12 h-12 border-4 border-slate-600 border-t-cyan-400 rounded-full mx-auto mb-4"
        />
        <p className="text-slate-400">Loading Omnisent...</p>
      </div>
    </div>
  );
};

// shared/components/error-fallback.tsx
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 bg-slate-900/50 border-slate-700">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          
          <h2 className="text-xl font-semibold text-slate-200 mb-2">
            Something went wrong
          </h2>
          
          <p className="text-slate-400 mb-6">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-slate-300 font-medium mb-2">
              Error details
            </summary>
            <pre className="text-xs text-red-400 bg-slate-800/50 p-3 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
          
          <div className="flex gap-3">
            <Button onClick={resetErrorBoundary} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Reload page
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './shared/styles/globals.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);