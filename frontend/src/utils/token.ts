// Utilidades para manejar JWT tokens

const TOKEN_KEY = 'omnisent-jwt-token';
const USER_KEY = 'omnisent-user';

export interface DecodedToken {
  sub: string;          // User ID
  role: string;         // User role
  username: string;     // Username
  exp: number;          // Expiration timestamp
  iat?: number;         // Issued at timestamp
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

/**
 * Guarda el token JWT en localStorage
 */
export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token to localStorage:', error);
  }
};

/**
 * Obtiene el token JWT de localStorage
 */
export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token from localStorage:', error);
    return null;
  }
};

/**
 * Elimina el token JWT de localStorage
 */
export const removeToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error removing token from localStorage:', error);
  }
};

/**
 * Decodifica un JWT token (sin verificar la firma)
 * Solo para leer datos del payload, NO para validación de seguridad
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    // JWT tiene 3 partes separadas por puntos: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Token JWT inválido: formato incorrecto');
      return null;
    }

    // Decodificar el payload (segunda parte)
    const payload = parts[1];
    
    // Agregar padding si es necesario para base64
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decodificar de base64
    const decodedPayload = atob(paddedPayload);
    
    // Parsear JSON
    const tokenData: DecodedToken = JSON.parse(decodedPayload);
    
    return tokenData;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Verifica si un token ha expirado
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    // Convertir timestamp a milisegundos y comparar con tiempo actual
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    
    // Agregar buffer de 30 segundos para evitar requests con tokens a punto de expirar
    const bufferTime = 30 * 1000;
    
    return currentTime >= (expirationTime - bufferTime);
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Obtiene el tiempo restante del token en segundos
 */
export const getTokenTimeRemaining = (token: string): number => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return 0;
    }

    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const timeRemaining = Math.max(0, Math.floor((expirationTime - currentTime) / 1000));
    
    return timeRemaining;
  } catch (error) {
    console.error('Error getting token time remaining:', error);
    return 0;
  }
};

/**
 * Verifica si el token actual es válido (existe y no ha expirado)
 */
export const isValidToken = (): boolean => {
  const token = getToken();
  if (!token) {
    return false;
  }
  
  return !isTokenExpired(token);
};

/**
 * Obtiene los datos del usuario desde el token
 */
export const getUserFromToken = (): DecodedToken | null => {
  const token = getToken();
  if (!token || isTokenExpired(token)) {
    return null;
  }
  
  return decodeToken(token);
};

/**
 * Guarda los datos del usuario en localStorage
 */
export const setUser = (user: User): void => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
  }
};

/**
 * Obtiene los datos del usuario de localStorage
 */
export const getUser = (): User | null => {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) {
      return null;
    }
    
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error getting user from localStorage:', error);
    return null;
  }
};

/**
 * Verifica si el usuario tiene un rol específico
 */
export const hasRole = (requiredRole: string): boolean => {
  const tokenData = getUserFromToken();
  if (!tokenData) {
    return false;
  }
  
  // Admin tiene acceso a todo
  if (tokenData.role === 'admin') {
    return true;
  }
  
  return tokenData.role === requiredRole;
};

/**
 * Verifica si el usuario es admin
 */
export const isAdmin = (): boolean => {
  return hasRole('admin');
};

/**
 * Formatea el tiempo restante del token en formato legible
 */
export const formatTokenTimeRemaining = (token?: string): string => {
  const timeInSeconds = token ? getTokenTimeRemaining(token) : 0;
  
  if (timeInSeconds <= 0) {
    return 'Expirado';
  }
  
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Limpia toda la información de autenticación
 */
export const clearAuth = (): void => {
  removeToken();
  // También limpiar cualquier otra información relacionada con auth
  localStorage.removeItem('omnisent-auth'); // Por compatibilidad con el sistema anterior
};

/**
 * Configurar auto-logout cuando el token expire
 */
export const setupAutoLogout = (onLogout: () => void): (() => void) => {
  const token = getToken();
  if (!token || isTokenExpired(token)) {
    return () => {}; // No setup si no hay token válido
  }
  
  const timeRemaining = getTokenTimeRemaining(token);
  
  const timeoutId = setTimeout(() => {
    console.log('🕒 Token expirado, cerrando sesión automáticamente...');
    clearAuth();
    onLogout();
  }, timeRemaining * 1000);
  
  // Retornar función para cancelar el timeout
  return () => clearTimeout(timeoutId);
};