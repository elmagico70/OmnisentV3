// hooks/useFilePermissions.ts
import { useMemo } from 'react';
import { useAuth } from '@/modules/auth/AuthContext';
import { FileItem } from '@/stores/filesStore';

export interface FilePermissions {
  canView: boolean;
  canDownload: boolean;
  canEdit: boolean;
  canRename: boolean;
  canDelete: boolean;
  canMove: boolean;
  canCopy: boolean;
  canShare: boolean;
  canUpload: boolean;
  canCreateFolder: boolean;
  canSetPermissions: boolean;
  canViewHistory: boolean;
}

export interface SystemPermissions {
  canAccessFiles: boolean;
  canViewAllFiles: boolean;
  canManageSystem: boolean;
  maxUploadSize: number; // in MB
  allowedFileTypes: string[];
  canCreatePublicShares: boolean;
  canCreatePasswordShares: boolean;
  canSetExpirationDates: boolean;
}

export const useFilePermissions = (file?: FileItem | null) => {
  const { user, hasRole, isAdmin } = useAuth();

  // System-wide permissions based on user role
  const systemPermissions = useMemo<SystemPermissions>(() => {
    if (!user) {
      return {
        canAccessFiles: false,
        canViewAllFiles: false,
        canManageSystem: false,
        maxUploadSize: 0,
        allowedFileTypes: [],
        canCreatePublicShares: false,
        canCreatePasswordShares: false,
        canSetExpirationDates: false,
      };
    }

    // Admin permissions
    if (isAdmin()) {
      return {
        canAccessFiles: true,
        canViewAllFiles: true,
        canManageSystem: true,
        maxUploadSize: 1024, // 1GB
        allowedFileTypes: ['*'], // All file types
        canCreatePublicShares: true,
        canCreatePasswordShares: true,
        canSetExpirationDates: true,
      };
    }

    // User permissions
    if (hasRole('user')) {
      return {
        canAccessFiles: true,
        canViewAllFiles: false,
        canManageSystem: false,
        maxUploadSize: 100, // 100MB
        allowedFileTypes: [
          // Documents
          'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt',
          // Spreadsheets
          'xls', 'xlsx', 'csv', 'ods',
          // Presentations
          'ppt', 'pptx', 'odp',
          // Images
          'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp',
          // Archives
          'zip', 'rar', '7z', 'tar', 'gz',
          // Code
          'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml',
          // Media
          'mp3', 'wav', 'mp4', 'avi', 'mov', 'webm'
        ],
        canCreatePublicShares: true,
        canCreatePasswordShares: true,
        canSetExpirationDates: true,
      };
    }

    // Guest permissions
    if (hasRole('guest')) {
      return {
        canAccessFiles: true,
        canViewAllFiles: false,
        canManageSystem: false,
        maxUploadSize: 10, // 10MB
        allowedFileTypes: [
          // Only basic file types
          'pdf', 'txt', 'jpg', 'jpeg', 'png', 'gif'
        ],
        canCreatePublicShares: false,
        canCreatePasswordShares: false,
        canSetExpirationDates: false,
      };
    }

    // Default (no permissions)
    return {
      canAccessFiles: false,
      canViewAllFiles: false,
      canManageSystem: false,
      maxUploadSize: 0,
      allowedFileTypes: [],
      canCreatePublicShares: false,
      canCreatePasswordShares: false,
      canSetExpirationDates: false,
    };
  }, [user, hasRole, isAdmin]);

  // File-specific permissions
  const filePermissions = useMemo<FilePermissions>(() => {
    if (!user || !file) {
      return {
        canView: false,
        canDownload: false,
        canEdit: false,
        canRename: false,
        canDelete: false,
        canMove: false,
        canCopy: false,
        canShare: false,
        canUpload: false,
        canCreateFolder: false,
        canSetPermissions: false,
        canViewHistory: false,
      };
    }

    // Admin has all permissions
    if (isAdmin()) {
      return {
        canView: true,
        canDownload: true,
        canEdit: true,
        canRename: true,
        canDelete: true,
        canMove: true,
        canCopy: true,
        canShare: true,
        canUpload: true,
        canCreateFolder: true,
        canSetPermissions: true,
        canViewHistory: true,
      };
    }

    // Check if user owns the file
    const isOwner = file.ownerId === user.id;
    
    // Check if file is shared publicly
    const isSharedPublic = file.shared && !file.protected;
    
    // Check explicit permissions from file metadata
    const hasExplicitPermissions = file.permissions && (
      file.permissions.read || 
      file.permissions.write || 
      file.permissions.delete
    );

    // Base permissions logic
    let permissions: FilePermissions = {
      canView: false,
      canDownload: false,
      canEdit: false,
      canRename: false,
      canDelete: false,
      canMove: false,
      canCopy: false,
      canShare: false,
      canUpload: false,
      canCreateFolder: false,
      canSetPermissions: false,
      canViewHistory: false,
    };

    // If user owns the file, they have most permissions
    if (isOwner) {
      permissions = {
        canView: true,
        canDownload: true,
        canEdit: true,
        canRename: true,
        canDelete: true,
        canMove: true,
        canCopy: true,
        canShare: systemPermissions.canCreatePublicShares,
        canUpload: file.type === 'folder',
        canCreateFolder: file.type === 'folder',
        canSetPermissions: true,
        canViewHistory: true,
      };
    }
    // If file has explicit permissions, use those
    else if (hasExplicitPermissions) {
      permissions = {
        canView: file.permissions.read,
        canDownload: file.permissions.read,
        canEdit: file.permissions.write,
        canRename: file.permissions.write && hasRole('user'),
        canDelete: file.permissions.delete,
        canMove: file.permissions.write && hasRole('user'),
        canCopy: file.permissions.read,
        canShare: file.permissions.share && systemPermissions.canCreatePublicShares,
        canUpload: file.permissions.write && file.type === 'folder',
        canCreateFolder: file.permissions.write && file.type === 'folder',
        canSetPermissions: false, // Only owner can set permissions
        canViewHistory: file.permissions.read,
      };
    }
    // If file is shared publicly and user has at least 'user' role
    else if (isSharedPublic && hasRole('user')) {
      permissions = {
        canView: true,
        canDownload: true,
        canEdit: false,
        canRename: false,
        canDelete: false,
        canMove: false,
        canCopy: true,
        canShare: false,
        canUpload: false,
        canCreateFolder: false,
        canSetPermissions: false,
        canViewHistory: false,
      };
    }
    // If file is shared publicly and user is guest
    else if (isSharedPublic && hasRole('guest')) {
      permissions = {
        canView: true,
        canDownload: true,
        canEdit: false,
        canRename: false,
        canDelete: false,
        canMove: false,
        canCopy: false,
        canShare: false,
        canUpload: false,
        canCreateFolder: false,
        canSetPermissions: false,
        canViewHistory: false,
      };
    }

    // Apply protected file restrictions
    if (file.protected && !isOwner && !isAdmin()) {
      permissions.canEdit = false;
      permissions.canRename = false;
      permissions.canDelete = false;
      permissions.canMove = false;
      permissions.canShare = false;
      permissions.canSetPermissions = false;
    }

    return permissions;
  }, [user, file, hasRole, isAdmin, systemPermissions]);

  // Utility functions
  const canPerformAction = (action: keyof FilePermissions): boolean => {
    return filePermissions[action];
  };

  const getActionMessage = (action: keyof FilePermissions): string => {
    if (!user) return 'Debes iniciar sesión para realizar esta acción';
    
    if (!filePermissions[action]) {
      const messages: Record<keyof FilePermissions, string> = {
        canView: 'No tienes permisos para ver este archivo',
        canDownload: 'No tienes permisos para descargar este archivo',
        canEdit: 'No tienes permisos para editar este archivo',
        canRename: 'No tienes permisos para renombrar este archivo',
        canDelete: 'No tienes permisos para eliminar este archivo',
        canMove: 'No tienes permisos para mover este archivo',
        canCopy: 'No tienes permisos para copiar este archivo',
        canShare: 'No tienes permisos para compartir este archivo',
        canUpload: 'No tienes permisos para subir archivos aquí',
        canCreateFolder: 'No tienes permisos para crear carpetas aquí',
        canSetPermissions: 'No tienes permisos para modificar los permisos',
        canViewHistory: 'No tienes permisos para ver el historial',
      };
      return messages[action];
    }
    
    return '';
  };

  const isFileTypeAllowed = (filename: string): boolean => {
    if (systemPermissions.allowedFileTypes.includes('*')) return true;
    
    const extension = filename.split('.').pop()?.toLowerCase();
    if (!extension) return false;
    
    return systemPermissions.allowedFileTypes.includes(extension);
  };

  const isFileSizeAllowed = (sizeInBytes: number): boolean => {
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return sizeInMB <= systemPermissions.maxUploadSize;
  };

  const getMaxUploadSize = (): string => {
    const size = systemPermissions.maxUploadSize;
    if (size >= 1024) {
      return `${(size / 1024).toFixed(1)}GB`;
    }
    return `${size}MB`;
  };

  const getRestrictedMessage = (filename?: string, sizeInBytes?: number): string => {
    if (filename && !isFileTypeAllowed(filename)) {
      return `Tipo de archivo no permitido. Tipos permitidos: ${systemPermissions.allowedFileTypes.join(', ')}`;
    }
    
    if (sizeInBytes && !isFileSizeAllowed(sizeInBytes)) {
      return `Archivo muy grande. Tamaño máximo: ${getMaxUploadSize()}`;
    }
    
    return '';
  };

  return {
    // Permissions objects
    systemPermissions,
    filePermissions,
    
    // Utility functions
    canPerformAction,
    getActionMessage,
    isFileTypeAllowed,
    isFileSizeAllowed,
    getMaxUploadSize,
    getRestrictedMessage,
    
    // Convenience boolean checks
    canAccess: systemPermissions.canAccessFiles,
    canViewAll: systemPermissions.canViewAllFiles,
    canManage: systemPermissions.canManageSystem,
    isOwner: file ? file.ownerId === user?.id : false,
    isProtected: file?.protected || false,
    isShared: file?.shared || false,
  };
};