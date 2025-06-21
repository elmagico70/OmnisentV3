import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Refine } from "@refinedev/core";
import { RefineSnackbarProvider } from "@refinedev/mui";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { Toaster } from "react-hot-toast";

// Layout y providers
import { OmniLayout } from "@/layout/OmniLayout";
import { ThemeProvider } from "@/shared/ThemeProvider";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ProtectedRoute } from "@/shared/ProtectedRoute";

// UI helpers
import { LoadingFallback } from "@/shared/LoadingFallback";
import { ErrorPage } from "@/shared/ErrorPage";

// Páginas principales
import DashboardPage from "@/features/dashboard/DashBoardPage";
import { SearchPage } from "@/features/search/SearchPage";
import { FilesPage } from "@/features/files/FilesPage";
import LoggerPage from "@/features/logger/LoggerPage";
import { NotesPage } from "@/features/notes/NotesPage";
import { AIPage } from "@/features/ai/AIPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { KanbanPage } from "@/features/kanban/KanbanPage";

// Lazy imports
const AdminPanel = lazy(() => import("@/features/admin/AdminPanelPage"));
const LoginPage = lazy(() => import("@/features/auth/LoginPage"));

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

const AdminWrapper = () => (
  <RefineKbarProvider>
    <RefineSnackbarProvider>
      <Refine routerProvider={undefined} dataProvider={undefined} options={{ syncWithLocation: true, warnWhenUnsavedChanges: true }}>
        <AdminPanel />
      </Refine>
    </RefineSnackbarProvider>
  </RefineKbarProvider>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
};

export default App;