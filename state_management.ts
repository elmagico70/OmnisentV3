// shared/stores/app.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  language: string;
  notifications: boolean;
}

interface AppState {
  settings: AppSettings;
  isOnline: boolean;
  systemHealth: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

interface AppActions {
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleSidebar: () => void;
  setOnlineStatus: (status: boolean) => void;
  updateSystemHealth: (health: Partial<AppState['systemHealth']>) => void;
}

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    immer((set) => ({
      settings: {
        theme: 'dark',
        sidebarCollapsed: false,
        language: 'en',
        notifications: true,
      },
      isOnline: navigator.onLine,
      systemHealth: {
        cpu: 0,
        memory: 0,
        disk: 0,
      },

      updateSettings: (newSettings) => {
        set((state) => {
          Object.assign(state.settings, newSettings);
        });
      },

      toggleSidebar: () => {
        set((state) => {
          state.settings.sidebarCollapsed = !state.settings.sidebarCollapsed;
        });
      },

      setOnlineStatus: (status) => {
        set((state) => {
          state.isOnline = status;
        });
      },

      updateSystemHealth: (health) => {
        set((state) => {
          Object.assign(state.systemHealth, health);
        });
      },
    })),
    { name: 'app-store' }
  )
);

// shared/hooks/useSystemMonitor.ts
import { useEffect } from 'react';
import { useAppStore } from '../stores/app.store';

export const useSystemMonitor = () => {
  const { updateSystemHealth, setOnlineStatus } = useAppStore();

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate system health monitoring
    const interval = setInterval(() => {
      updateSystemHealth({
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        disk: Math.floor(Math.random() * 100),
      });
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [updateSystemHealth, setOnlineStatus]);
};

// shared/api/client.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { useAuthStore } from '@/entities/auth';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Get auth state
        const authState = useAuthStore.getState();
        
        if (authState.isAuthenticated) {
          const sessionData = sessionStorage.getItem('auth-session');
          if (sessionData) {
            const session = JSON.parse(sessionData);
            config.headers.Authorization = `Bearer ${session.accessToken}`;
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const authState = useAuthStore.getState();
          if (authState.isAuthenticated) {
            try {
              await authState.refreshSession();
              // Retry original request
              return this.client.request(error.config);
            } catch (refreshError) {
              // Refresh failed, logout
              authState.logout();
              window.location.href = '/auth/login';
            }
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }
}

export const apiClient = new ApiClient();

// shared/hooks/useQuery.ts - Wrapper for TanStack Query
import { useQuery as useTanStackQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';

export const useQuery = <TData = unknown, TError = Error>(
  options: UseQueryOptions<TData, TError>
) => {
  return useTanStackQuery<TData, TError>(options);
};

export const useMutation = <TData = unknown, TError = Error, TVariables = void>(
  options: UseMutationOptions<TData, TError, TVariables>
) => {
  return useMutation<TData, TError, TVariables>(options);
};

export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();
  return queryClient.invalidateQueries;
};

// entities/notes/store/notes.store.ts - Example of entity store
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { apiClient } from '@/shared/api/client';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
}

interface NotesState {
  notes: Note[];
  activeNote: Note | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedTags: string[];
}

interface NotesActions {
  loadNotes: () => Promise<void>;
  createNote: (title: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setActiveNote: (note: Note | null) => void;
  setSearchQuery: (query: string) => void;
  toggleTag: (tag: string) => void;
}

export const useNotesStore = create<NotesState & NotesActions>()(
  immer((set, get) => ({
    notes: [],
    activeNote: null,
    isLoading: false,
    error: null,
    searchQuery: '',
    selectedTags: [],

    loadNotes: async () => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        const response = await apiClient.get('/notes');
        
        set((state) => {
          state.notes = response.data;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to load notes';
          state.isLoading = false;
        });
      }
    },

    createNote: async (title) => {
      try {
        const response = await apiClient.post('/notes', {
          title,
          content: '',
          tags: [],
          pinned: false,
        });

        set((state) => {
          state.notes.unshift(response.data);
          state.activeNote = response.data;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to create note';
        });
      }
    },

    updateNote: async (id, updates) => {
      try {
        const response = await apiClient.patch(`/notes/${id}`, updates);
        
        set((state) => {
          const index = state.notes.findIndex(note => note.id === id);
          if (index !== -1) {
            state.notes[index] = response.data;
          }
          if (state.activeNote?.id === id) {
            state.activeNote = response.data;
          }
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update note';
        });
      }
    },

    deleteNote: async (id) => {
      try {
        await apiClient.delete(`/notes/${id}`);
        
        set((state) => {
          state.notes = state.notes.filter(note => note.id !== id);
          if (state.activeNote?.id === id) {
            state.activeNote = null;
          }
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to delete note';
        });
      }
    },

    setActiveNote: (note) => {
      set((state) => {
        state.activeNote = note;
      });
    },

    setSearchQuery: (query) => {
      set((state) => {
        state.searchQuery = query;
      });
    },

    toggleTag: (tag) => {
      set((state) => {
        if (state.selectedTags.includes(tag)) {
          state.selectedTags = state.selectedTags.filter(t => t !== tag);
        } else {
          state.selectedTags.push(tag);
        }
      });
    },
  }))
);