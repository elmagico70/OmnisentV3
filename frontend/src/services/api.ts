// services/api.ts - Updated with file management endpoints
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getToken, removeToken, isTokenExpired } from '../utils/token';

// Configuración base de la API
const API_BASE_URL = 'http://localhost:8000';

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Agregar JWT token automáticamente
api.interceptors.request.use(
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    const token = getToken();
    
    // Agregar token si existe y no ha expirado
    if (token && !isTokenExpired(token)) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    
    // Log de requests en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Manejar respuestas y errores
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    // Log de respuestas exitosas en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    
    return response;
  },
  (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Log de errores
    console.error(`❌ API Error: ${error.response?.status}`, {
      url: originalRequest?.url,
      message: error.message,
      response: error.response?.data,
    });
    
    // Manejar diferentes tipos de errores
    switch (error.response?.status) {
      case 401:
        // Token expirado o inválido
        console.warn('🔒 Token expirado o inválido, redirigiendo al login...');
        handleUnauthorized();
        break;
        
      case 403:
        // Sin permisos
        console.warn('🚫 Sin permisos para acceder a este recurso');
        handleForbidden();
        break;
        
      case 404:
        console.warn('🔍 Recurso no encontrado');
        break;
        
      case 500:
        console.error('🔥 Error interno del servidor');
        handleServerError();
        break;
        
      default:
        console.error('🌐 Error de red o desconocido');
    }
    
    return Promise.reject(error);
  }
);

// Funciones de manejo de errores
const handleUnauthorized = () => {
  removeToken();
  window.dispatchEvent(new CustomEvent('auth:logout'));
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const handleForbidden = () => {
  window.dispatchEvent(new CustomEvent('api:forbidden', {
    detail: { message: 'No tienes permisos para realizar esta acción' }
  }));
};

const handleServerError = () => {
  window.dispatchEvent(new CustomEvent('api:serverError', {
    detail: { message: 'Error interno del servidor. Intenta de nuevo más tarde.' }
  }));
};

// Funciones de API específicas
export const apiClient = {
  // Auth endpoints
  auth: {
    login: (credentials: { username: string; password: string }) =>
      api.post('/api/auth/login', credentials),
    
    logout: () =>
      api.post('/api/auth/logout'),
    
    me: () =>
      api.get('/api/auth/me'),
    
    refresh: () =>
      api.post('/api/auth/refresh'),
  },
  
  // Dashboard endpoints
  dashboard: {
    getData: () =>
      api.get('/api/dashboard'),
  },
  
  // Admin endpoints
  admin: {
    getUsers: () =>
      api.get('/api/admin/users'),
    
    getMetrics: () =>
      api.get('/api/admin/metrics'),
    
    getSecurity: () =>
      api.get('/api/admin/security'),
    
    toggleUserStatus: (userId: string) =>
      api.post(`/api/admin/users/${userId}/toggle`),
    
    deleteUser: (userId: string) =>
      api.delete(`/api/admin/users/${userId}`),
  },
  
  // Enhanced Files endpoints
  files: {
    // Get files and folders
    getFiles: (params?: { 
      path?: string; 
      filter_type?: string; 
      search?: string;
      sort_by?: string;
      sort_order?: string;
    }) =>
      api.get('/api/files', { params }),
    
    // Get file details
    getFile: (fileId: string) =>
      api.get(`/api/files/${fileId}`),
    
    // Upload single file
    uploadFile: (formData: FormData, config?: { onUploadProgress?: (progressEvent: any) => void }) =>
      api.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        ...config,
      }),
    
    // Upload multiple files
    uploadFiles: (formData: FormData, config?: { onUploadProgress?: (progressEvent: any) => void }) =>
      api.post('/api/files/upload/batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        ...config,
      }),
    
    // Create folder
    createFolder: (data: { name: string; path: string }) =>
      api.post('/api/files/folders', data),
    
    // Rename file/folder
    renameFile: (fileId: string, data: { name: string }) =>
      api.patch(`/api/files/${fileId}`, data),
    
    // Update file metadata
    updateFile: (fileId: string, data: { 
      description?: string; 
      tags?: string[];
      protected?: boolean;
    }) =>
      api.patch(`/api/files/${fileId}/metadata`, data),
    
    // Delete file/folder
    deleteFile: (fileId: string) =>
      api.delete(`/api/files/${fileId}`),
    
    // Delete multiple files
    deleteFiles: (fileIds: string[]) =>
      api.post('/api/files/delete/batch', { fileIds }),
    
    // Move files
    moveFiles: (data: { fileIds: string[]; targetPath: string }) =>
      api.post('/api/files/move', data),
    
    // Copy files
    copyFiles: (data: { fileIds: string[]; targetPath: string }) =>
      api.post('/api/files/copy', data),
    
    // Star/unstar file
    toggleStar: (fileId: string) =>
      api.post(`/api/files/${fileId}/star`),
    
    // Protect/unprotect file
    toggleProtected: (fileId: string) =>
      api.post(`/api/files/${fileId}/protect`),
    
    // Get file versions
    getVersions: (fileId: string) =>
      api.get(`/api/files/${fileId}/versions`),
    
    // Restore file version
    restoreVersion: (fileId: string, versionId: string) =>
      api.post(`/api/files/${fileId}/versions/${versionId}/restore`),
    
    // Download file
    downloadFile: (fileId: string) =>
      api.get(`/api/files/${fileId}/download`, { 
        responseType: 'blob',
        timeout: 60000 // 1 minute for downloads
      }),
    
    // Download multiple files as zip
    downloadFiles: (fileIds: string[]) =>
      api.post('/api/files/download/batch', { fileIds }, { 
        responseType: 'blob',
        timeout: 120000 // 2 minutes for batch downloads
      }),
    
    // Search files
    searchFiles: (params: {
      q: string;
      path?: string;
      type?: string;
      extension?: string;
      owner?: string;
      starred?: boolean;
      protected?: boolean;
    }) =>
      api.get('/api/files/search', { params }),
    
    // Get recently accessed files
    getRecentFiles: (limit?: number) =>
      api.get('/api/files/recent', { params: { limit } }),
    
    // Get starred files
    getStarredFiles: () =>
      api.get('/api/files/starred'),
    
    // Get shared files
    getSharedFiles: () =>
      api.get('/api/files/shared'),
    
    // Share endpoints
    createShareLink: (fileId: string, options?: {
      password?: string;
      expiresAt?: string;
      maxDownloads?: number;
    }) =>
      api.post(`/api/files/${fileId}/share`, options),
    
    getShareLink: (fileId: string) =>
      api.get(`/api/files/${fileId}/share`),
    
    revokeShareLink: (shareId: string) =>
      api.delete(`/api/shares/${shareId}`),
    
    getSharedFile: (token: string, password?: string) =>
      api.get(`/api/shares/${token}`, {
        data: password ? { password } : undefined
      }),
    
    downloadSharedFile: (token: string, password?: string) =>
      api.post(`/api/shares/${token}/download`, 
        password ? { password } : {}, 
        { responseType: 'blob' }
      ),
    
    // Permissions endpoints
    getPermissions: (fileId: string) =>
      api.get(`/api/files/${fileId}/permissions`),
    
    setPermissions: (fileId: string, permissions: {
      userId: string;
      read: boolean;
      write: boolean;
      delete: boolean;
      share: boolean;
    }[]) =>
      api.post(`/api/files/${fileId}/permissions`, { permissions }),
    
    // Storage info
    getStorageInfo: () =>
      api.get('/api/files/storage'),
    
    // File preview/thumbnail
    getPreview: (fileId: string, size?: 'small' | 'medium' | 'large') =>
      api.get(`/api/files/${fileId}/preview`, { 
        params: { size },
        responseType: 'blob' 
      }),
    
    getThumbnail: (fileId: string, size?: number) =>
      api.get(`/api/files/${fileId}/thumbnail`, { 
        params: { size },
        responseType: 'blob' 
      }),
  },
  
  // Logs endpoints
  logs: {
    getLogs: (params?: { level?: string; limit?: number }) =>
      api.get('/api/logs', { params }),
  },
  
  // Search endpoints
  search: {
    search: (params: { q: string; type?: string }) =>
      api.get('/api/search', { params }),
  },
  
  // Settings endpoints
  settings: {
    getSettings: () =>
      api.get('/api/settings'),
    
    updateSettings: (settings: any) =>
      api.put('/api/settings', settings),
  },
  
  // Notes endpoints
  notes: {
    getNotes: () =>
      api.get('/api/notes'),
    
    createNote: (note: any) =>
      api.post('/api/notes', note),
  },
  
  // AI endpoints
  ai: {
    ask: (prompt: string) =>
      api.post('/api/ai/ask', { prompt }),
  },
};

// Utility functions for file operations
export const fileUtils = {
  // Format file size
  formatSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // Get file extension
  getExtension: (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  },
  
  // Check if file is image
  isImage: (filename: string): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'];
    return imageExtensions.includes(fileUtils.getExtension(filename));
  },
  
  // Check if file is video
  isVideo: (filename: string): boolean => {
    const videoExtensions = ['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', 'wmv'];
    return videoExtensions.includes(fileUtils.getExtension(filename));
  },
  
  // Check if file is audio
  isAudio: (filename: string): boolean => {
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
    return audioExtensions.includes(fileUtils.getExtension(filename));
  },
  
  // Check if file is document
  isDocument: (filename: string): boolean => {
    const docExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx'];
    return docExtensions.includes(fileUtils.getExtension(filename));
  },
  
  // Check if file is code
  isCode: (filename: string): boolean => {
    const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'];
    return codeExtensions.includes(fileUtils.getExtension(filename));
  },
  
  // Check if file is archive
  isArchive: (filename: string): boolean => {
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
    return archiveExtensions.includes(fileUtils.getExtension(filename));
  },
  
  // Generate file URL for preview
  getFileUrl: (fileId: string): string => {
    return `${API_BASE_URL}/api/files/${fileId}/download`;
  },
  
  // Generate thumbnail URL
  getThumbnailUrl: (fileId: string, size: number = 150): string => {
    return `${API_BASE_URL}/api/files/${fileId}/thumbnail?size=${size}`;
  },
  
  // Generate preview URL
  getPreviewUrl: (fileId: string, size: 'small' | 'medium' | 'large' = 'medium'): string => {
    return `${API_BASE_URL}/api/files/${fileId}/preview?size=${size}`;
  },
  
  // Validate file type
  isValidFileType: (filename: string, allowedTypes: string[]): boolean => {
    if (allowedTypes.includes('*')) return true;
    const extension = fileUtils.getExtension(filename);
    return allowedTypes.includes(extension);
  },
  
  // Validate file size
  isValidFileSize: (size: number, maxSizeInMB: number): boolean => {
    const sizeInMB = size / (1024 * 1024);
    return sizeInMB <= maxSizeInMB;
  },
  
  // Create blob URL for local preview
  createBlobUrl: (file: File): string => {
    return URL.createObjectURL(file);
  },
  
  // Revoke blob URL
  revokeBlobUrl: (url: string): void => {
    URL.revokeObjectURL(url);
  },
  
  // Read file as text
  readFileAsText: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },
  
  // Read file as data URL
  readFileAsDataUrl: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};

// Función para hacer requests personalizados
export const makeRequest = {
  get: (url: string, config?: AxiosRequestConfig) => api.get(url, config),
  post: (url: string, data?: any, config?: AxiosRequestConfig) => api.post(url, data, config),
  put: (url: string, data?: any, config?: AxiosRequestConfig) => api.put(url, data, config),
  delete: (url: string, config?: AxiosRequestConfig) => api.delete(url, config),
  patch: (url: string, data?: any, config?: AxiosRequestConfig) => api.patch(url, data, config),
};

export default api;