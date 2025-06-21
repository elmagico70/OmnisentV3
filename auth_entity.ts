// entities/auth/types/index.ts
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  avatar?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// entities/auth/api/index.ts
import { apiClient } from '@/shared/api';
import type { User, AuthSession } from '../types';

export const authApi = {
  login: async (credentials: { username: string; password: string }): Promise<AuthSession> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
  
  refresh: async (refreshToken: string): Promise<AuthSession> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },
  
  me: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// entities/auth/store/index.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { authApi } from '../api';
import type { User, AuthSession } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    login: async (credentials) => {
      try {
        set({ isLoading: true, error: null });
        const session = await authApi.login(credentials);
        
        // Guardar tokens de forma segura
        sessionStorage.setItem('auth-session', JSON.stringify(session));
        
        set({ 
          user: session.user, 
          isAuthenticated: true, 
          isLoading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Login failed',
          isLoading: false 
        });
        throw error;
      }
    },

    logout: async () => {
      try {
        await authApi.logout();
      } catch (error) {
        console.warn('Logout request failed, proceeding with local cleanup');
      } finally {
        sessionStorage.removeItem('auth-session');
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: null 
        });
      }
    },

    refreshSession: async () => {
      try {
        const sessionData = sessionStorage.getItem('auth-session');
        if (!sessionData) {
          set({ isLoading: false });
          return;
        }

        const session: AuthSession = JSON.parse(sessionData);
        
        // Verificar si el token está cerca de expirar
        if (Date.now() >= session.expiresAt - 300000) { // 5 min buffer
          const newSession = await authApi.refresh(session.refreshToken);
          sessionStorage.setItem('auth-session', JSON.stringify(newSession));
          set({ user: newSession.user, isAuthenticated: true });
        } else {
          set({ user: session.user, isAuthenticated: true });
        }
      } catch (error) {
        sessionStorage.removeItem('auth-session');
        set({ user: null, isAuthenticated: false });
      } finally {
        set({ isLoading: false });
      }
    },

    clearError: () => set({ error: null }),
  }))
);

// entities/auth/hooks/useAuth.ts
import { useAuthStore } from '../store';

export const useAuth = () => {
  const state = useAuthStore();
  
  return {
    ...state,
    hasRole: (role: string) => {
      if (!state.user) return false;
      if (state.user.role === 'admin') return true;
      return state.user.role === role;
    },
    isAdmin: () => state.user?.role === 'admin',
  };
};

// entities/auth/components/LoginForm.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card } from '@/shared/components/ui/card';
import { useAuth } from '../hooks/useAuth';

export const LoginForm = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(credentials);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950"
    >
      <Card className="w-full max-w-md p-8 bg-slate-900/50 backdrop-blur border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            OMNISENT
          </h1>
          <p className="text-slate-400 mt-2">Advanced System Interface</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="bg-slate-800 border-slate-700"
            />
          </div>
          
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </motion.div>
  );
};