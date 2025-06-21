// utils/fileHelpers.ts
import { FileItem } from '@/store/filesSlice';

export const fileHelpers = {
  // Generate unique file ID
  generateFileId: (): string => {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Clean file name
  cleanFileName: (name: string): string => {
    return name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
  },

  // Generate folder structure
  generateFolderStructure: (files: FileItem[]): any => {
    const folders: any = {};
    
    files.forEach(file => {
      const pathParts = file.path.split('/').filter(Boolean);
      let current = folders;
      
      pathParts.forEach(part => {
        if (!current[part]) {
          current[part] = { files: [], folders: {} };
        }
        current = current[part].folders;
      });
      
      // Add file to the appropriate folder
      const parentPath = pathParts.slice(0, -1);
      let parent = folders;
      parentPath.forEach(part => {
        parent = parent[part].folders;
      });
      
      if (file.type === 'file') {
        const folderName = pathParts[pathParts.length - 1] || 'root';
        if (!parent[folderName]) {
          parent[folderName] = { files: [], folders: {} };
        }
        parent[folderName].files.push(file);
      }
    });
    
    return folders;
  },

  // Calculate folder size
  calculateFolderSize: (files: FileItem[], folderPath: string): number => {
    return files
      .filter(file => file.path.startsWith(folderPath) && file.type === 'file')
      .reduce((total, file) => total + file.size, 0);
  },

  // Get file breadcrumbs
  getFileBreadcrumbs: (path: string): Array<{ name: string; path: string }> => {
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
    
    return breadcrumbs;
  },

  // Validate file upload
  validateFileUpload: (
    file: File, 
    allowedTypes: string[], 
    maxSize: number
  ): { valid: boolean; error?: string } => {
    // Check file type
    if (!allowedTypes.includes('*')) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedTypes.includes(extension)) {
        return {
          valid: false,
          error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        };
      }
    }
    
    // Check file size
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxSize}MB`
      };
    }
    
    return { valid: true };
  },

  // Sort files with folders first
  sortFilesWithFoldersFirst: (
    files: FileItem[], 
    sortBy: string, 
    sortOrder: 'asc' | 'desc'
  ): FileItem[] => {
    return [...files].sort((a, b) => {
      // Folders first
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      
      // Then sort by specified criteria
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'modified':
          aValue = new Date(a.modified).getTime();
          bValue = new Date(b.modified).getTime();
          break;
        case 'created':
          aValue = new Date(a.created).getTime();
          bValue = new Date(b.created).getTime();
          break;
        case 'type':
          aValue = a.extension || '';
          bValue = b.extension || '';
          break;
        case 'owner':
          aValue = a.owner.toLowerCase();
          bValue = b.owner.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  },

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
    return imageExtensions.includes(fileHelpers.getExtension(filename));
  },

  // Check if file is video
  isVideo: (filename: string): boolean => {
    const videoExtensions = ['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', 'wmv'];
    return videoExtensions.includes(fileHelpers.getExtension(filename));
  },

  // Check if file is audio
  isAudio: (filename: string): boolean => {
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
    return audioExtensions.includes(fileHelpers.getExtension(filename));
  },

  // Check if file is document
  isDocument: (filename: string): boolean => {
    const docExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx'];
    return docExtensions.includes(fileHelpers.getExtension(filename));
  },

  // Check if file is code
  isCode: (filename: string): boolean => {
    const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'];
    return codeExtensions.includes(fileHelpers.getExtension(filename));
  },

  // Check if file is archive
  isArchive: (filename: string): boolean => {
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
    return archiveExtensions.includes(fileHelpers.getExtension(filename));
  },

  // Generate file URL for preview
  getFileUrl: (fileId: string): string => {
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/files/${fileId}/download`;
  },

  // Generate thumbnail URL
  getThumbnailUrl: (fileId: string, size: number = 150): string => {
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/files/${fileId}/thumbnail?size=${size}`;
  },

  // Generate preview URL
  getPreviewUrl: (fileId: string, size: 'small' | 'medium' | 'large' = 'medium'): string => {
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/files/${fileId}/preview?size=${size}`;
  },

  // Validate file type
  isValidFileType: (filename: string, allowedTypes: string[]): boolean => {
    if (allowedTypes.includes('*')) return true;
    const extension = fileHelpers.getExtension(filename);
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

  // Generate unique filename to avoid conflicts
  generateUniqueFilename: (filename: string, existingFiles: string[]): string => {
    let name = filename;
    let counter = 1;
    
    while (existingFiles.includes(name)) {
      const parts = filename.split('.');
      if (parts.length > 1) {
        const extension = parts.pop();
        const basename = parts.join('.');
        name = `${basename} (${counter}).${extension}`;
      } else {
        name = `${filename} (${counter})`;
      }
      counter++;
    }
    
    return name;
  },

  // Format date for display
  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  },

  // Get file type category
  getFileCategory: (filename: string): string => {
    if (fileHelpers.isImage(filename)) return 'images';
    if (fileHelpers.isVideo(filename)) return 'videos';
    if (fileHelpers.isAudio(filename)) return 'music';
    if (fileHelpers.isDocument(filename)) return 'documents';
    if (fileHelpers.isCode(filename)) return 'code';
    if (fileHelpers.isArchive(filename)) return 'archives';
    return 'other';
  },

  // Get file icon color
  getFileIconColor: (filename: string): string => {
    const extension = fileHelpers.getExtension(filename);
    
    switch (extension) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return 'text-yellow-400';
      case 'json':
      case 'xml':
        return 'text-orange-400';
      case 'html':
      case 'css':
        return 'text-blue-400';
      case 'md':
      case 'txt':
        return 'text-gray-400';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return 'text-green-400';
      case 'zip':
      case 'rar':
      case '7z':
        return 'text-purple-400';
      case 'mp3':
      case 'wav':
        return 'text-pink-400';
      case 'mp4':
      case 'avi':
        return 'text-red-400';
      case 'pdf':
        return 'text-red-500';
      case 'doc':
      case 'docx':
        return 'text-blue-500';
      default:
        return 'text-omni-textDim';
    }
  }
};