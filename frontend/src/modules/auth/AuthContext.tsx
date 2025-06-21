import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { 
  setToken, 
  removeToken, 
  getToken, 
  getUserFromToken, 
  isValidToken, 
  clearAuth,
  setupAutoLogout,
  setUser as setUserStorage,
  getUser as getUserStorage,
  DecodedToken
} from "../../utils/token";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  // Estado
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  
  // Acciones
  login: (token: string, userData: User) => void;
  logout: () => void;
  checkAuth: () => void;
  
  // Utilidades
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  checkAuth: () => {},
  hasRole: () => false,
  isAdmin: () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para verificar autenticación
  const checkAuth = useCallback(() => {
    setLoading(true);
    
    try {
      const token = getToken();
      
      if (!token || !isValidToken()) {
        // No hay token válido
        setIsAuthenticated(false);
        setUser(null);
        clearAuth();
        return;
      }
      
      // Obtener datos del usuario del token
      const tokenData = getUserFromToken();
      const storedUser = getUserStorage();
      
      if (tokenData && storedUser) {
        setIsAuthenticated(true);
        setUser(storedUser);
        
        // Configurar auto-logout cuando expire el token
        const cancelAutoLogout = setupAutoLogout(() => {
          logout();
        });
        
        // Limpiar timeout cuando se desmonte el componente
        return cancelAutoLogout;
      } else {
        // Token inválido o corrupto
        setIsAuthenticated(false);
        setUser(null);
        clearAuth();
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      setUser(null);
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  // Función de login
  const login = useCallback((token: string, userData: User) => {
    try {
      setToken(token);
      setUserStorage(userData);
      setIsAuthenticated(true);
      setUser(userData);
      
      console.log('✅ Login exitoso:', userData);
      
      // Configurar auto-logout
      setupAutoLogout(() => {
        logout();
      });
    } catch (error) {
      console.error('Error during login:', error);
    }
  }, []);

  // Función de logout
  const logout = useCallback(() => {
    try {
      clearAuth();
      setIsAuthenticated(false);
      setUser(null);
      
      console.log('🚪 Logout exitoso');
      
      // Redirigir al login si no estamos ya ahí
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, []);

  // Verificar rol específico
  const hasRole = useCallback((role: string): boolean => {
    if (!user) return false;
    
    // Admin tiene acceso a todo
    if (user.role === 'admin') return true;
    
    return user.role === role;
  }, [user]);

  // Verificar si es admin
  const isAdmin = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  // Efecto para verificar autenticación al montar
  useEffect(() => {
    const cleanup = checkAuth();
    
    // Limpiar auto-logout al desmontar
    return cleanup;
  }, [checkAuth]);

  // Escuchar eventos de logout automático
  useEffect(() => {
    const handleAutoLogout = () => {
      logout();
    };

    const handleForbidden = (event: CustomEvent) => {
      console.warn('🚫 Acceso denegado:', event.detail?.message);
      // Aquí podrías mostrar un toast o modal
    };

    const handleServerError = (event: CustomEvent) => {
      console.error('🔥 Error del servidor:', event.detail?.message);
      // Aquí podrías mostrar un toast o modal
    };

    window.addEventListener('auth:logout', handleAutoLogout);
    window.addEventListener('api:forbidden', handleForbidden as EventListener);
    window.addEventListener('api:serverError', handleServerError as EventListener);

    return () => {
      window.removeEventListener('auth:logout', handleAutoLogout);
      window.removeEventListener('api:forbidden', handleForbidden as EventListener);
      window.removeEventListener('api:serverError', handleServerError as EventListener);
    };
  }, [logout]);

  // Verificar autenticación periódicamente (cada 5 minutos)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        const token = getToken();
        if (!token || !isValidToken()) {
          console.log('🕒 Token expirado, cerrando sesión...');
          logout();
        }
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    checkAuth,
    hasRole,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};