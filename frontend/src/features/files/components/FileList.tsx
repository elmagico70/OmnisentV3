// components/files/FileList.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  File,
  FileText,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Music,
  Video,
  Star,
  Shield,
  Share2,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  Edit3,
  Lock,
  Unlock,
  User,
  Calendar,
  HardDrive,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { FileItem, useFilesStore } from '@/store/filesSlice';
import { useFilePermissions } from '@/hooks/useFilePermissions';

interface FileListProps {
  files: FileItem[];
}

interface FileRowProps {
  file: FileItem;
  isSelected: boolean;
  onSelect: (fileId: string) => void;
  onDoubleClick: (file: FileItem) => void;
}

const getFileIcon = (file: FileItem) => {
  if (file.type === 'folder') return FolderOpen;
  
  switch (file.extension) {
    case 'txt':
    case 'md':
    case 'doc':
    case 'docx':
    case 'pdf':
      return FileText;
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'json':
    case 'xml':
    case 'html':
    case 'css':
    case 'py':
    case 'java':
    case 'cpp':
      return FileCode;
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return FileArchive;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return ImageIcon;
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
      return Music;
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'webm':
    case 'mkv':
      return Video;
    default:
      return File;
  }
};

const getFileColor = (file: FileItem) => {
  if (file.type === 'folder') return 'text-omni-cyan';
  
  switch (file.extension) {
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
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
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
};

const FileRow: React.FC<FileRowProps> = ({ file, isSelected, onSelect, onDoubleClick }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);
  
  const {
    openPreview,
    openShareModal,
    toggleStar,
    toggleProtected,
    deleteFiles,
    renameFile,
  } = useFilesStore();
  
  const { filePermissions, canPerformAction } = useFilePermissions(file);
  
  const Icon = getFileIcon(file);
  const color = getFileColor(file);

  const handleRename = async () => {
    if (newName.trim() && newName !== file.name) {
      try {
        await renameFile(file.id, newName.trim());
        setIsRenaming(false);
      } catch (error) {
        console.error('Error renaming file:', error);
        setNewName(file.name);
      }
    } else {
      setIsRenaming(false);
      setNewName(file.name);
    }
  };

  const handleAction = async (action: string) => {
    setShowMenu(false);
    
    switch (action) {
      case 'preview':
        if (canPerformAction('canView')) {
          openPreview(file);
        }
        break;
      case 'download':
        if (canPerformAction('canDownload')) {
          window.open(file.url, '_blank');
        }
        break;
      case 'share':
        if (canPerformAction('canShare')) {
          openShareModal(file);
        }
        break;
      case 'star':
        if (canPerformAction('canEdit')) {
          await toggleStar(file.id);
        }
        break;
      case 'protect':
        if (canPerformAction('canSetPermissions')) {
          await toggleProtected(file.id);
        }
        break;
      case 'rename':
        if (canPerformAction('canRename')) {
          setIsRenaming(true);
        }
        break;
      case 'delete':
        if (canPerformAction('canDelete')) {
          if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
            await deleteFiles([file.id]);
          }
        }
        break;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group relative"
    >
      <div
        className={cn(
          "grid grid-cols-12 gap-4 p-3 rounded-lg transition-all cursor-pointer relative",
          isSelected && "bg-omni-cyan/10 ring-1 ring-omni-cyan",
          "hover:bg-omni-surface2"
        )}
        onClick={(e) => {
          if (!isRenaming) {
            if (e.ctrlKey || e.metaKey) {
              onSelect(file.id);
            } else {
              useFilesStore.getState().selectFile(file.id);
            }
          }
        }}
        onDoubleClick={() => !isRenaming && onDoubleClick(file)}
      >
        {/* Selection indicator */}
        {isSelected && (
          <motion.div
            layoutId="selectedIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-omni-cyan rounded-r"
          />
        )}

        {/* Icon and Name */}
        <div className="col-span-5 flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            {file.thumbnailUrl ? (
              <img
                src={file.thumbnailUrl}
                alt={file.name}
                className="w-8 h-8 object-cover rounded"
              />
            ) : (
              <Icon className={cn("w-5 h-5", color)} />
            )}
            
            {/* Badges overlay */}
            <div className="absolute -top-1 -right-1 flex gap-1">
              {file.starred && (
                <Star className="w-3 h-3 text-omni-yellow fill-current" />
              )}
              {file.protected && (
                <Shield className="w-3 h-3 text-omni-green" />
              )}
              {file.shared && (
                <Share2 className="w-3 h-3 text-omni-cyan" />
              )}
            </div>
          </div>
          
          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename();
                  } else if (e.key === 'Escape') {
                    setIsRenaming(false);
                    setNewName(file.name);
                  }
                }}
                className="w-full text-sm font-medium text-omni-text bg-omni-surface border border-omni-border rounded px-2 py-1"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div>
                <p className="text-sm font-medium text-omni-text truncate" title={file.name}>
                  {file.name}
                </p>
                {file.description && (
                  <p className="text-xs text-omni-textDim truncate" title={file.description}>
                    {file.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Size */}
        <div className="col-span-2 flex items-center">
          <div className="text-sm text-omni-textDim">
            {file.type === 'folder' ? (
              <div className="flex items-center gap-1">
                <FolderOpen className="w-4 h-4" />
                <span>Folder</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <HardDrive className="w-4 h-4" />
                <span>{formatFileSize(file.size)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modified Date */}
        <div className="col-span-2 flex items-center">
          <div className="text-sm text-omni-textDim">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(file.modified)}</span>
            </div>
          </div>
        </div>

        {/* Owner */}
        <div className="col-span-2 flex items-center">
          <div className="text-sm text-omni-textDim">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span className="truncate" title={file.owner}>
                {file.owner}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="col-span-1 flex items-center justify-end">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canPerformAction('canView') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('preview');
                }}
                className="p-1 rounded hover:bg-omni-surface hover:text-omni-cyan transition-colors"
                title={file.type === 'folder' ? 'Open' : 'Preview'}
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            
            {canPerformAction('canDownload') && file.type === 'file' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('download');
                }}
                className="p-1 rounded hover:bg-omni-surface hover:text-omni-cyan transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 rounded hover:bg-omni-surface hover:text-omni-cyan transition-colors"
                title="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-full right-0 mt-1 bg-omni-surface2 border border-omni-border rounded-lg shadow-xl z-20 py-1 min-w-[150px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canPerformAction('canShare') && (
                      <button
                        onClick={() => handleAction('share')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-omni-surface hover:text-omni-cyan transition-colors flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    )}
                    
                    {canPerformAction('canEdit') && (
                      <button
                        onClick={() => handleAction('star')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-omni-surface hover:text-omni-yellow transition-colors flex items-center gap-2"
                      >
                        <Star className={cn("w-4 h-4", file.starred && "fill-current")} />
                        {file.starred ? 'Unstar' : 'Star'}
                      </button>
                    )}
                    
                    {canPerformAction('canSetPermissions') && (
                      <button
                        onClick={() => handleAction('protect')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-omni-surface hover:text-omni-green transition-colors flex items-center gap-2"
                      >
                        {file.protected ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {file.protected ? 'Unprotect' : 'Protect'}
                      </button>
                    )}
                    
                    {canPerformAction('canRename') && (
                      <button
                        onClick={() => handleAction('rename')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-omni-surface hover:text-omni-cyan transition-colors flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Rename
                      </button>
                    )}
                    
                    <hr className="my-1 border-omni-border" />
                    
                    {canPerformAction('canDelete') && (
                      <button
                        onClick={() => handleAction('delete')}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-omni-surface hover:text-omni-red text-omni-red transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const FileList: React.FC<FileListProps> = ({ files }) => {
  const { selectedFiles, navigateToFolder, openPreview, toggleSelection } = useFilesStore();

  const handleDoubleClick = (file: FileItem) => {
    if (file.type === 'folder') {
      navigateToFolder(file);
    } else {
      openPreview(file);
    }
  };

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-3 py-2 text-xs text-omni-textDim border-b border-omni-border bg-omni-surface/50">
        <div className="col-span-5 font-medium">Name</div>
        <div className="col-span-2 font-medium">Size</div>
        <div className="col-span-2 font-medium">Modified</div>
        <div className="col-span-2 font-medium">Owner</div>
        <div className="col-span-1"></div>
      </div>
      
      {/* File rows */}
      <AnimatePresence mode="popLayout">
        {files.map((file) => (
          <FileRow
            key={file.id}
            file={file}
            isSelected={selectedFiles.includes(file.id)}
            onSelect={toggleSelection}
            onDoubleClick={handleDoubleClick}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};