import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Refine } from "@refinedev/core";
import { RefineSnackbarProvider } from "@refinedev/mui";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { Toaster } from "react-hot-toast";

// Layout y providers
import { OmniLayout } from "@/layout/OmniLayout";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/modules/auth/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// UI helpers
import { LoadingFallback } from "@/components/LoadingFallback";
import { ErrorPage } from "@/pages/ErrorPage";

// Páginas principales
import DashboardPage from "@/pages/DashBoardPage";
import { SearchPage } from "@/pages/SearchPage";
import { FilesPage } from "@/pages/FilesPage";
import LoggerPage from "@/pages/LoggerPage";
import { NotesPage } from "@/pages/NotesPage";
import { AIPage } from "@/pages/AIPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { KanbanPage } from "@/pages/KanbanPage";

// Lazy imports
const AdminPanel = lazy(() => import("@/pages/AdminPanelPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: (failureCount, error: any) => {
        // No reintentar en errores 401/403
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RefineKbarProvider>
        <RefineSnackbarProvider>
          <Refine
            routerProvider={undefined}
            dataProvider={undefined}
            options={{ syncWithLocation: true, warnWhenUnsavedChanges: true }}
          >
            <AuthProvider>
              <ThemeProvider defaultTheme="dark" storageKey="omnisent-theme">
                <BrowserRouter>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      {/* Ruta de login (sin protección) */}
                      <Route path="/login" element={<LoginPage />} />
                      
                      {/* Rutas protegidas */}
                      <Route 
                        path="/" 
                        element={
                          <ProtectedRoute>
                            <OmniLayout />
                          </ProtectedRoute>
                        } 
                        errorElement={<ErrorPage />}
                      >
                        {/* Rutas principales (requieren autenticación) */}
                        <Route index element={<DashboardPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/files" element={<FilesPage />} />
                        <Route path="/notes" element={<NotesPage />} />
                        <Route path="/ai" element={<AIPage />} />
                        <Route path="/tasks" element={<KanbanPage />} />
                        
                        {/* Rutas que requieren rol específico */}
                        <Route 
                          path="/logger" 
                          element={
                            <ProtectedRoute requiredRole="admin">
                              <LoggerPage />
                            </ProtectedRoute>
                          } 
                        />
                        
                        <Route 
                          path="/settings" 
                          element={
                            <ProtectedRoute requiredRole="admin">
                              <SettingsPage />
                            </ProtectedRoute>
                          } 
                        />

                        {/* Rutas de administrador */}
                        <Route
                          path="/admin"
                          element={
                            <ProtectedRoute requiredRole="admin">
                              <AdminPanel />
                            </ProtectedRoute>
                          }
                        />

                        {/* 404 para rutas protegidas */}
                        <Route path="*" element={<ErrorPage />} />
                      </Route>
                    </Routes>
                  </Suspense>
                </BrowserRouter>

                {/* Toast notifications */}
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#27272a',
                      color: '#ffffff',
                      border: '1px solid #3f3f46',
                    },
                    success: {
                      iconTheme: {
                        primary: '#06b6d4',
                        secondary: '#ffffff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#ffffff',
                      },
                    },
                  }}
                />
                
                <RefineKbar />
              </ThemeProvider>
            </AuthProvider>
          </Refine>
        </RefineSnackbarProvider>
      </RefineKbarProvider>
    </QueryClientProvider>
  );
};

export default App;