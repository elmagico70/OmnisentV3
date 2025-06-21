// entities/files/types/index.ts
export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  mimeType?: string;
  extension?: string;
  path: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  metadata: FileMetadata;
  permissions: FilePermissions;
}

export interface FileMetadata {
  starred: boolean;
  tags: string[];
  description?: string;
  color?: string;
}

export interface FilePermissions {
  owner: string;
  readable: boolean;
  writable: boolean;
  shareable: boolean;
}

export interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// entities/files/api/index.ts
import { apiClient } from '@/shared/api';
import type { FileItem, FileUpload } from '../types';

export const filesApi = {
  getFiles: async (path: string = '/'): Promise<FileItem[]> => {
    const response = await apiClient.get('/files', { params: { path } });
    return response.data;
  },

  uploadFile: async (
    file: File, 
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<FileItem> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await apiClient.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  createFolder: async (name: string, path: string): Promise<FileItem> => {
    const response = await apiClient.post('/files/folders', { name, path });
    return response.data;
  },

  deleteFile: async (id: string): Promise<void> => {
    await apiClient.delete(`/files/${id}`);
  },

  renameFile: async (id: string, name: string): Promise<FileItem> => {
    const response = await apiClient.patch(`/files/${id}`, { name });
    return response.data;
  },

  updateMetadata: async (id: string, metadata: Partial<FileMetadata>): Promise<FileItem> => {
    const response = await apiClient.patch(`/files/${id}/metadata`, metadata);
    return response.data;
  },
};

// entities/files/store/files.store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { filesApi } from '../api';
import type { FileItem, FileUpload } from '../types';

interface FilesState {
  files: FileItem[];
  currentPath: string;
  selectedFiles: string[];
  uploads: FileUpload[];
  isLoading: boolean;
  error: string | null;
}

interface FilesActions {
  loadFiles: (path?: string) => Promise<void>;
  uploadFiles: (files: File[], path?: string) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  deleteFiles: (ids: string[]) => Promise<void>;
  selectFile: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  setCurrentPath: (path: string) => void;
}

export const useFilesStore = create<FilesState & FilesActions>()(
  immer((set, get) => ({
    files: [],
    currentPath: '/',
    selectedFiles: [],
    uploads: [],
    isLoading: false,
    error: null,

    loadFiles: async (path = get().currentPath) => {
      try {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        const files = await filesApi.getFiles(path);
        
        set((state) => {
          state.files = files;
          state.currentPath = path;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to load files';
          state.isLoading = false;
        });
      }
    },

    uploadFiles: async (files, path = get().currentPath) => {
      const uploadIds = files.map(() => crypto.randomUUID());
      
      // Initialize upload tracking
      set((state) => {
        files.forEach((file, index) => {
          state.uploads.push({
            id: uploadIds[index],
            file,
            progress: 0,
            status: 'pending',
          });
        });
      });

      // Upload files concurrently
      const uploadPromises = files.map(async (file, index) => {
        const uploadId = uploadIds[index];
        
        try {
          set((state) => {
            const upload = state.uploads.find(u => u.id === uploadId);
            if (upload) upload.status = 'uploading';
          });

          await filesApi.uploadFile(file, path, (progress) => {
            set((state) => {
              const upload = state.uploads.find(u => u.id === uploadId);
              if (upload) upload.progress = progress;
            });
          });

          set((state) => {
            const upload = state.uploads.find(u => u.id === uploadId);
            if (upload) upload.status = 'success';
          });
        } catch (error) {
          set((state) => {
            const upload = state.uploads.find(u => u.id === uploadId);
            if (upload) {
              upload.status = 'error';
              upload.error = error instanceof Error ? error.message : 'Upload failed';
            }
          });
        }
      });

      await Promise.allSettled(uploadPromises);
      
      // Reload files and cleanup uploads
      await get().loadFiles();
      setTimeout(() => {
        set((state) => {
          state.uploads = state.uploads.filter(u => u.status === 'uploading');
        });
      }, 3000);
    },

    createFolder: async (name) => {
      try {
        await filesApi.createFolder(name, get().currentPath);
        await get().loadFiles();
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to create folder';
        });
      }
    },

    deleteFiles: async (ids) => {
      try {
        await Promise.all(ids.map(id => filesApi.deleteFile(id)));
        await get().loadFiles();
        get().clearSelection();
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to delete files';
        });
      }
    },

    selectFile: (id, multi = false) => {
      set((state) => {
        if (multi) {
          if (state.selectedFiles.includes(id)) {
            state.selectedFiles = state.selectedFiles.filter(f => f !== id);
          } else {
            state.selectedFiles.push(id);
          }
        } else {
          state.selectedFiles = [id];
        }
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selectedFiles = [];
      });
    },

    setCurrentPath: (path) => {
      set((state) => {
        state.currentPath = path;
      });
    },
  }))
);

// entities/files/hooks/useFiles.ts
import { useFilesStore } from '../store/files.store';

export const useFiles = () => {
  return useFilesStore();
};

export const useFileSelection = () => {
  const { selectedFiles, selectFile, clearSelection } = useFilesStore();
  
  return {
    selectedFiles,
    selectFile,
    clearSelection,
    hasSelection: selectedFiles.length > 0,
    selectionCount: selectedFiles.length,
  };
};

// entities/files/components/FileExplorer.tsx
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileGrid } from './FileGrid';
import { FileUploadZone } from './FileUploadZone';
import { Toolbar } from './Toolbar';
import { Breadcrumbs } from './Breadcrumbs';
import { useFiles } from '../hooks/useFiles';

export const FileExplorer = () => {
  const { loadFiles, isLoading, error } = useFiles();

  useEffect(() => {
    loadFiles();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-400 mb-2">Error loading files</div>
          <button 
            onClick={() => loadFiles()} 
            className="text-cyan-400 hover:text-cyan-300"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Toolbar />
      <Breadcrumbs />
      
      <FileUploadZone className="flex-1">
        <AnimatePresence>
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-64"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            </motion.div>
          ) : (
            <FileGrid />
          )}
        </AnimatePresence>
      </FileUploadZone>
    </div>
  );
};