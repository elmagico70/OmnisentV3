import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, user, loading, hasRole } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-omni-bg">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-omni-cyan mb-4"
          >
            <Loader2 className="w-12 h-12 mx-auto" />
          </motion.div>
          <h3 className="text-lg font-semibold text-omni-text mb-2">
            Verificando autenticación...
          </h3>
          <p className="text-omni-textDim">
            Por favor espera mientras validamos tu sesión
          </p>
        </motion.div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Si se requiere un rol específico, verificarlo
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-omni-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 15 }}
            className="w-20 h-20 bg-gradient-to-br from-omni-red to-red-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-omni-text mb-4">
            Acceso Denegado
          </h2>
          
          <p className="text-omni-textDim mb-6">
            No tienes permisos para acceder a esta página. 
            Se requiere el rol: <span className="text-omni-cyan font-semibold">{requiredRole}</span>
          </p>
          
          <div className="bg-omni-surface border border-omni-border rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-omni-cyan/20 rounded-full flex items-center justify-center">
                <span className="text-omni-cyan font-medium">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <p className="text-omni-text font-medium">{user?.username}</p>
                <p className="text-omni-textDim">Rol actual: {user?.role}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-omni-surface border border-omni-border rounded-lg text-omni-text hover:bg-omni-surface-hover transition-colors"
            >
              Volver
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 bg-omni-cyan text-white rounded-lg hover:bg-omni-cyan/90 transition-colors"
            >
              Ir al Dashboard
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Si todo está bien, renderizar los children
  return <>{children}</>;
};

// HOC para envolver componentes con protección de rutas
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: string
) => {
  return (props: P) => (
    <ProtectedRoute requiredRole={requiredRole}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Hook personalizado para verificar permisos
export const usePermissions = () => {
  const { user, hasRole, isAdmin } = useAuth();
  
  return {
    user,
    hasRole,
    isAdmin,
    canAccess: (requiredRole: string) => hasRole(requiredRole),
    canAccessAdmin: () => isAdmin(),
  };
};