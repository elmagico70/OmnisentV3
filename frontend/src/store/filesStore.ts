// stores/filesStore.ts
import { create } from "zustand";
import { apiClient } from "@/services/api";

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  size: number;
  modified: string;
  created: string;
  path: string;
  parentId?: string;
  starred: boolean;
  protected: boolean;
  shared: boolean;
  owner: string;
  ownerId: string;
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    share: boolean;
  };
  mimeType?: string;
  url?: string;
  thumbnailUrl?: string;
  versions?: FileVersion[];
  tags?: string[];
  description?: string;
}

export interface FileVersion {
  id: string;
  version: number;
  size: number;
  modified: string;
  modifiedBy: string;
  url: string;
}

export interface ShareLink {
  id: string;
  fileId: string;
  token: string;
  expiresAt?: string;
  password?: string;
  downloads: number;
  maxDownloads?: number;
  qrCode?: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

interface FilesState {
  // Data
  files: FileItem[];
  currentPath: string;
  breadcrumbs: { name: string; path: string }[];
  selectedFiles: string[];
  
  // UI State
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'size' | 'modified' | 'type';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  filterType: 'all' | 'starred' | 'protected' | 'shared' | 'images' | 'documents' | 'videos';
  
  // Upload
  uploadQueue: UploadProgress[];
  dragActive: boolean;
  
  // Loading states
  loading: boolean;
  uploading: boolean;
  
  // Preview
  previewFile: FileItem | null;
  previewOpen: boolean;
  
  // Share
  shareModal: {
    open: boolean;
    file: FileItem | null;
    shareLink: ShareLink | null;
  };

  // Actions - Navigation
  setCurrentPath: (path: string) => void;
  navigateToFolder: (folder: FileItem) => void;
  navigateUp: () => void;
  navigateToPath: (path: string) => void;
  
  // Actions - File Management
  loadFiles: (path?: string) => Promise<void>;
  createFolder: (name: string, path?: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  deleteFiles: (fileIds: string[]) => Promise<void>;
  toggleStar: (fileId: string) => Promise<void>;
  toggleProtected: (fileId: string) => Promise<void>;
  moveFiles: (fileIds: string[], targetPath: string) => Promise<void>;
  
  // Actions - Upload
  uploadFiles: (files: File[], path?: string) => Promise<void>;
  cancelUpload: (fileId: string) => void;
  retryUpload: (fileId: string) => void;
  setDragActive: (active: boolean) => void;
  
  // Actions - UI
  setViewMode: (mode: 'grid' | 'list') => void;
  setSorting: (sortBy: string, sortOrder?: 'asc' | 'desc') => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (filter: string) => void;
  selectFile: (fileId: string) => void;
  selectMultiple: (fileIds: string[]) => void;
  clearSelection: () => void;
  toggleSelection: (fileId: string) => void;
  
  // Actions - Preview
  openPreview: (file: FileItem) => void;
  closePreview: () => void;
  
  // Actions - Share
  openShareModal: (file: FileItem) => void;
  closeShareModal: () => void;
  createShareLink: (fileId: string, options?: {
    password?: string;
    expiresAt?: string;
    maxDownloads?: number;
  }) => Promise<void>;
  revokeShareLink: (shareId: string) => Promise<void>;
}

export const useFilesStore = create<FilesState>((set, get) => ({
  // Initial state
  files: [],
  currentPath: '/',
  breadcrumbs: [{ name: 'Home', path: '/' }],
  selectedFiles: [],
  
  viewMode: 'grid',
  sortBy: 'name',
  sortOrder: 'asc',
  searchQuery: '',
  filterType: 'all',
  
  uploadQueue: [],
  dragActive: false,
  
  loading: false,
  uploading: false,
  
  previewFile: null,
  previewOpen: false,
  
  shareModal: {
    open: false,
    file: null,
    shareLink: null,
  },

  // Navigation actions
  setCurrentPath: (path) => {
    set({ currentPath: path });
    get().updateBreadcrumbs(path);
  },
  
  navigateToFolder: (folder) => {
    const newPath = folder.path;
    get().setCurrentPath(newPath);
    get().loadFiles(newPath);
  },
  
  navigateUp: () => {
    const currentPath = get().currentPath;
    if (currentPath === '/') return;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const parentPath = '/' + pathParts.join('/');
    get().setCurrentPath(parentPath);
    get().loadFiles(parentPath);
  },
  
  navigateToPath: (path) => {
    get().setCurrentPath(path);
    get().loadFiles(path);
  },

  // File management actions
  loadFiles: async (path = get().currentPath) => {
    set({ loading: true });
    try {
      const response = await apiClient.files.getFiles({
        path,
        filter_type: get().filterType === 'all' ? undefined : get().filterType
      });
      
      set({ 
        files: response.data || [],
        loading: false 
      });
    } catch (error) {
      console.error('Error loading files:', error);
      set({ loading: false });
    }
  },
  
  createFolder: async (name, path = get().currentPath) => {
    try {
      await apiClient.files.createFolder({ name, path });
      await get().loadFiles();
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },
  
  renameFile: async (fileId, newName) => {
    try {
      await apiClient.files.renameFile(fileId, { name: newName });
      await get().loadFiles();
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    }
  },
  
  deleteFiles: async (fileIds) => {
    try {
      await Promise.all(fileIds.map(id => apiClient.files.deleteFile(id)));
      await get().loadFiles();
      set({ selectedFiles: [] });
    } catch (error) {
      console.error('Error deleting files:', error);
      throw error;
    }
  },
  
  toggleStar: async (fileId) => {
    try {
      await apiClient.files.toggleStar(fileId);
      await get().loadFiles();
    } catch (error) {
      console.error('Error toggling star:', error);
      throw error;
    }
  },
  
  toggleProtected: async (fileId) => {
    try {
      await apiClient.files.toggleProtected(fileId);
      await get().loadFiles();
    } catch (error) {
      console.error('Error toggling protected:', error);
      throw error;
    }
  },
  
  moveFiles: async (fileIds, targetPath) => {
    try {
      await apiClient.files.moveFiles({ fileIds, targetPath });
      await get().loadFiles();
      set({ selectedFiles: [] });
    } catch (error) {
      console.error('Error moving files:', error);
      throw error;
    }
  },

  // Upload actions
  uploadFiles: async (files, path = get().currentPath) => {
    set({ uploading: true });
    
    const uploadPromises = Array.from(files).map(async (file) => {
      const fileId = `upload_${Date.now()}_${Math.random()}`;
      
      // Add to upload queue
      set(state => ({
        uploadQueue: [...state.uploadQueue, {
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'uploading'
        }]
      }));
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', path);
        
        const response = await apiClient.files.uploadFile(formData, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            
            set(state => ({
              uploadQueue: state.uploadQueue.map(item =>
                item.fileId === fileId 
                  ? { ...item, progress }
                  : item
              )
            }));
          }
        });
        
        // Mark as completed
        set(state => ({
          uploadQueue: state.uploadQueue.map(item =>
            item.fileId === fileId 
              ? { ...item, status: 'completed', progress: 100 }
              : item
          )
        }));
        
      } catch (error) {
        console.error('Upload error:', error);
        set(state => ({
          uploadQueue: state.uploadQueue.map(item =>
            item.fileId === fileId 
              ? { ...item, status: 'error', error: 'Upload failed' }
              : item
          )
        }));
      }
    });
    
    await Promise.all(uploadPromises);
    
    // Clean up completed uploads after delay
    setTimeout(() => {
      set(state => ({
        uploadQueue: state.uploadQueue.filter(item => 
          item.status !== 'completed'
        )
      }));
    }, 3000);
    
    set({ uploading: false });
    await get().loadFiles();
  },
  
  cancelUpload: (fileId) => {
    set(state => ({
      uploadQueue: state.uploadQueue.map(item =>
        item.fileId === fileId 
          ? { ...item, status: 'cancelled' }
          : item
      )
    }));
  },
  
  retryUpload: async (fileId) => {
    // Implementation for retry logic
    console.log('Retry upload:', fileId);
  },
  
  setDragActive: (active) => set({ dragActive: active }),

  // UI actions
  setViewMode: (mode) => set({ viewMode: mode }),
  
  setSorting: (sortBy, sortOrder) => {
    const currentSortBy = get().sortBy;
    const currentSortOrder = get().sortOrder;
    
    const newSortOrder = sortOrder || 
      (sortBy === currentSortBy && currentSortOrder === 'asc' ? 'desc' : 'asc');
    
    set({ 
      sortBy: sortBy as any,
      sortOrder: newSortOrder 
    });
  },
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setFilterType: (filter) => {
    set({ filterType: filter as any });
    get().loadFiles();
  },
  
  selectFile: (fileId) => set({ selectedFiles: [fileId] }),
  
  selectMultiple: (fileIds) => set({ selectedFiles: fileIds }),
  
  clearSelection: () => set({ selectedFiles: [] }),
  
  toggleSelection: (fileId) => {
    const { selectedFiles } = get();
    const isSelected = selectedFiles.includes(fileId);
    
    if (isSelected) {
      set({ selectedFiles: selectedFiles.filter(id => id !== fileId) });
    } else {
      set({ selectedFiles: [...selectedFiles, fileId] });
    }
  },

  // Preview actions
  openPreview: (file) => {
    set({ 
      previewFile: file,
      previewOpen: true 
    });
  },
  
  closePreview: () => {
    set({ 
      previewFile: null,
      previewOpen: false 
    });
  },

  // Share actions
  openShareModal: (file) => {
    set({
      shareModal: {
        open: true,
        file,
        shareLink: null
      }
    });
  },
  
  closeShareModal: () => {
    set({
      shareModal: {
        open: false,
        file: null,
        shareLink: null
      }
    });
  },
  
  createShareLink: async (fileId, options = {}) => {
    try {
      const response = await apiClient.files.createShareLink(fileId, options);
      
      set(state => ({
        shareModal: {
          ...state.shareModal,
          shareLink: response.data
        }
      }));
    } catch (error) {
      console.error('Error creating share link:', error);
      throw error;
    }
  },
  
  revokeShareLink: async (shareId) => {
    try {
      await apiClient.files.revokeShareLink(shareId);
      
      set(state => ({
        shareModal: {
          ...state.shareModal,
          shareLink: null
        }
      }));
    } catch (error) {
      console.error('Error revoking share link:', error);
      throw error;
    }
  },

  // Helper methods
  updateBreadcrumbs: (path: string) => {
    const parts = path.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Home', path: '/' }];
    
    let currentPath = '';
    parts.forEach(part => {
      currentPath += `/${part}`;
      breadcrumbs.push({
        name: part,
        path: currentPath
      });
    });
    
    set({ breadcrumbs });
  },
} as any));