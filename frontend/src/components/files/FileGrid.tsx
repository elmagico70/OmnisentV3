// components/files/FileGrid.tsx
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
  Copy,
  Move,
  Trash2,
  Edit3,
  Lock,
  Unlock,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { FileItem, useFilesStore } from '@/store/filesStore';
import { useFilePermissions } from '@/hooks/useFilePermissions';

interface FileGridProps {
  files: FileItem[];
}

interface FileCardProps {
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

const FileCard: React.FC<FileCardProps> = ({ file, isSelected, onSelect, onDoubleClick }) => {
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
        setNewName(file.name); // Revert on error
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
          // Implement download logic
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      className="relative group"
    >
      <div
        className={cn(
          "omni-card p-4 cursor-pointer transition-all duration-200 relative",
          isSelected && "ring-2 ring-omni-cyan bg-omni-cyan/10",
          "hover:border-omni-cyan/50"
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
            className="absolute top-2 left-2 w-4 h-4 bg-omni-cyan rounded-full flex items-center justify-center"
          >
            <div className="w-2 h-2 bg-white rounded-full" />
          </motion.div>
        )}

        {/* File content */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            {/* File icon or thumbnail */}
            {file.thumbnailUrl ? (
              <img
                src={file.thumbnailUrl}
                alt={file.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <Icon className={cn("w-16 h-16", color)} />
            )}
            
            {/* File badges */}
            <div className="absolute -top-2 -right-2 flex flex-col gap-1">
              {file.starred && (
                <Star className="w-4 h-4 text-omni-yellow fill-current" />
              )}
              {file.protected && (
                <Shield className="w-4 h-4 text-omni-green" />
              )}
              {file.shared && (
                <Share2 className="w-4 h-4 text-omni-cyan" />
              )}
            </div>
          </div>

          {/* File name */}
          <div className="w-full">
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
                className="w-full text-sm font-medium text-omni-text bg-omni-surface border border-omni-border rounded px-2 py-1 text-center"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p
                className="text-sm font-medium text-omni-text truncate px-1"
                title={file.name}
              >
                {file.name}
              </p>
            )}
            
            <div className="flex items-center justify-center gap-2 text-xs text-omni-textDim mt-1">
              {file.type === 'folder' ? (
                <span>Folder</span>
              ) : (
                <>
                  <span>{formatFileSize(file.size)}</span>
                  {file.extension && (
                    <>
                      <span>•</span>
                      <span className="uppercase">{file.extension}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action menu */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-omni-surface2 transition-all"
        >
          <MoreVertical className="w-4 h-4 text-omni-textDim" />
        </button>

        {/* Dropdown menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-8 right-2 bg-omni-surface2 border border-omni-border rounded-lg shadow-xl z-20 py-1 min-w-[150px]"
              onClick={(e) => e.stopPropagation()}
            >
              {canPerformAction('canView') && (
                <button
                  onClick={() => handleAction('preview')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-omni-surface hover:text-omni-cyan transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {file.type === 'folder' ? 'Open' : 'Preview'}
                </button>
              )}
              
              {canPerformAction('canDownload') && file.type === 'file' && (
                <button
                  onClick={() => handleAction('download')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-omni-surface hover:text-omni-cyan transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
              
              {canPerformAction('canShare') && (
                <button
                  onClick={() => handleAction('share')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-omni-surface hover:text-omni-cyan transition-colors flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              )}
              
              <hr className="my-1 border-omni-border" />
              
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
    </motion.div>
  );
};

export const FileGrid: React.FC<FileGridProps> = ({ files }) => {
  const { selectedFiles, navigateToFolder, openPreview, toggleSelection } = useFilesStore();

  const handleDoubleClick = (file: FileItem) => {
    if (file.type === 'folder') {
      navigateToFolder(file);
    } else {
      openPreview(file);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
      <AnimatePresence mode="popLayout">
        {files.map((file) => (
          <FileCard
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