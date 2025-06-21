// pages/FilesPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Grid,
  List,
  Upload,
  FolderPlus,
  RefreshCw,
  Star,
  Shield,
  Share2,
  Download,
  Trash2,
  Copy,
  Move,
  Eye,
  MoreVertical,
  ChevronRight,
  Home,
  AlertTriangle,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  X,
  Plus,
  Check,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useFilesStore } from '@/store/filesStore';
import { useFilePermissions } from '@/hooks/useFilePermissions';
import { useAuth } from '@/modules/auth/AuthContext';

// Components imports (we'll create these next)
import { FileGrid } from '@/components/files/FileGrid';
import { FileList } from '@/components/files/FileList';
import { FileUpload } from '@/components/files/FileUpload';
import { FilePreview } from '@/components/files/FilePreview';
import { ShareModal } from '@/components/files/ShareModal';
import { CreateFolderModal } from '@/components/files/CreateFolderModal';
import { BulkActions } from '@/components/files/BulkActions';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Files', icon: FileText, count: 0 },
  { id: 'starred', label: 'Starred', icon: Star, count: 0 },
  { id: 'protected', label: 'Protected', icon: Shield, count: 0 },
  { id: 'shared', label: 'Shared', icon: Share2, count: 0 },
  { id: 'images', label: 'Images', icon: Image, count: 0 },
  { id: 'documents', label: 'Documents', icon: FileText, count: 0 },
  { id: 'videos', label: 'Videos', icon: Video, count: 0 },
  { id: 'music', label: 'Music', icon: Music, count: 0 },
  { id: 'archives', label: 'Archives', icon: Archive, count: 0 },
  { id: 'code', label: 'Code', icon: Code, count: 0 },
];

const SORT_OPTIONS = [
  { id: 'name', label: 'Name' },
  { id: 'modified', label: 'Modified' },
  { id: 'size', label: 'Size' },
  { id: 'type', label: 'Type' },
];

export const FilesPage: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Store state
  const {
    files,
    currentPath,
    breadcrumbs,
    selectedFiles,
    viewMode,
    sortBy,
    sortOrder,
    searchQuery,
    filterType,
    loading,
    uploading,
    dragActive,
    previewOpen,
    shareModal,
    uploadQueue,
    
    // Actions
    loadFiles,
    setViewMode,
    setSorting,
    setSearchQuery,
    setFilterType,
    clearSelection,
    navigateToPath,
    navigateUp,
    createFolder,
    uploadFiles,
    setDragActive,
    openPreview,
    openShareModal,
  } = useFilesStore();

  // Permissions
  const { systemPermissions, canAccess } = useFilePermissions();

  // Load files on mount and path changes
  useEffect(() => {
    if (canAccess) {
      loadFiles();
    }
  }, [canAccess, currentPath]);

  // Filter and sort files
  const filteredAndSortedFiles = React.useMemo(() => {
    let filtered = [...files];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      switch (filterType) {
        case 'starred':
          filtered = filtered.filter(file => file.starred);
          break;
        case 'protected':
          filtered = filtered.filter(file => file.protected);
          break;
        case 'shared':
          filtered = filtered.filter(file => file.shared);
          break;
        case 'images':
          filtered = filtered.filter(file => 
            file.mimeType?.startsWith('image/') ||
            ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(file.extension || '')
          );
          break;
        case 'documents':
          filtered = filtered.filter(file => 
            ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(file.extension || '')
          );
          break;
        case 'videos':
          filtered = filtered.filter(file => 
            file.mimeType?.startsWith('video/') ||
            ['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(file.extension || '')
          );
          break;
        case 'music':
          filtered = filtered.filter(file => 
            file.mimeType?.startsWith('audio/') ||
            ['mp3', 'wav', 'ogg', 'flac'].includes(file.extension || '')
          );
          break;
        case 'archives':
          filtered = filtered.filter(file => 
            ['zip', 'rar', '7z', 'tar', 'gz'].includes(file.extension || '')
          );
          break;
        case 'code':
          filtered = filtered.filter(file => 
            ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp'].includes(file.extension || '')
          );
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      // Folders first
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;

      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'modified':
          aValue = new Date(a.modified).getTime();
          bValue = new Date(b.modified).getTime();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'type':
          aValue = a.extension || '';
          bValue = b.extension || '';
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

    return filtered;
  }, [files, searchQuery, filterType, sortBy, sortOrder]);

  // Calculate filter counts
  const filterCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: files.length,
      starred: files.filter(f => f.starred).length,
      protected: files.filter(f => f.protected).length,
      shared: files.filter(f => f.shared).length,
      images: files.filter(f => f.mimeType?.startsWith('image/') || 
        ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(f.extension || '')).length,
      documents: files.filter(f => 
        ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(f.extension || '')).length,
      videos: files.filter(f => f.mimeType?.startsWith('video/') || 
        ['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(f.extension || '')).length,
      music: files.filter(f => f.mimeType?.startsWith('audio/') || 
        ['mp3', 'wav', 'ogg', 'flac'].includes(f.extension || '')).length,
      archives: files.filter(f => 
        ['zip', 'rar', '7z', 'tar', 'gz'].includes(f.extension || '')).length,
      code: files.filter(f => 
        ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp'].includes(f.extension || '')).length,
    };
    return counts;
  }, [files]);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      uploadFiles(droppedFiles);
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      uploadFiles(Array.from(selectedFiles));
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Create folder handler
  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder(name);
      setShowCreateFolder(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-omni-red mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-omni-text mb-2">
            Access Denied
          </h3>
          <p className="text-omni-textDim">
            You don't have permission to access the file manager.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full flex flex-col relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {dragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-omni-cyan/10 border-2 border-dashed border-omni-cyan z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <Upload className="w-16 h-16 text-omni-cyan mx-auto mb-4" />
              <p className="text-xl font-semibold text-omni-cyan">
                Drop files here to upload
              </p>
              <p className="text-omni-textDim mt-2">
                Maximum {systemPermissions.maxUploadSize}MB per file
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-omni-text mb-2">File Manager</h1>
            <p className="text-omni-textDim">
              Manage your files and folders • {files.length} items
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadFiles()}
              disabled={loading}
              className="p-2 rounded-lg bg-omni-surface hover:bg-omni-surface2 text-omni-textDim hover:text-omni-text transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
            
            <div className="h-6 w-px bg-omni-border" />
            
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 rounded-lg bg-omni-surface hover:bg-omni-surface2 text-omni-textDim hover:text-omni-text transition-colors"
              title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-omni-textDim mb-4">
          <Home className="w-4 h-4" />
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              <button
                onClick={() => navigateToPath(crumb.path)}
                className={cn(
                  "hover:text-omni-cyan transition-colors",
                  index === breadcrumbs.length - 1 && "text-omni-cyan font-medium"
                )}
              >
                {crumb.name}
              </button>
              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="w-4 h-4" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-omni-textDim" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files and folders..."
              className="omni-input pl-10 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-omni-textDim hover:text-omni-text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Upload files */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="omni-btn flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            
            {/* Create folder */}
            <button
              onClick={() => setShowCreateFolder(true)}
              className="omni-btn flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </button>
            
            <div className="h-6 w-px bg-omni-border" />
            
            {/* Filters */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "omni-btn flex items-center gap-2",
                  showFilters && "bg-omni-cyan/20 border-omni-cyan text-omni-cyan"
                )}
              >
                <Filter className="w-4 h-4" />
                Filter
                {filterType !== 'all' && (
                  <span className="bg-omni-cyan text-omni-bg text-xs px-1.5 py-0.5 rounded-full">
                    {filterCounts[filterType]}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute top-full mt-2 right-0 bg-omni-surface border border-omni-border rounded-lg shadow-xl z-10 p-2 min-w-[200px]"
                  >
                    {FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setFilterType(option.id);
                          setShowFilters(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                          filterType === option.id
                            ? "bg-omni-cyan/20 text-omni-cyan"
                            : "hover:bg-omni-surface2 text-omni-textDim hover:text-omni-text"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </div>
                        <span className="text-xs">
                          {filterCounts[option.id] || 0}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className={cn(
                  "omni-btn flex items-center gap-2",
                  showSortMenu && "bg-omni-cyan/20 border-omni-cyan text-omni-cyan"
                )}
              >
                Sort: {SORT_OPTIONS.find(opt => opt.id === sortBy)?.label}
              </button>
              
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute top-full mt-2 right-0 bg-omni-surface border border-omni-border rounded-lg shadow-xl z-10 p-2 min-w-[150px]"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSorting(option.id);
                          setShowSortMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                          sortBy === option.id
                            ? "bg-omni-cyan/20 text-omni-cyan"
                            : "hover:bg-omni-surface2 text-omni-textDim hover:text-omni-text"
                        )}
                      >
                        {option.label}
                        {sortBy === option.id && (
                          <span className="text-xs">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedFiles.length > 0 && (
        <BulkActions 
          selectedFiles={selectedFiles}
          onClearSelection={clearSelection}
        />
      )}

      {/* Upload progress */}
      {uploadQueue.length > 0 && (
        <FileUpload uploadQueue={uploadQueue} />
      )}

      {/* File list/grid */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-omni-cyan animate-spin mx-auto mb-2" />
              <p className="text-omni-textDim">Loading files...</p>
            </div>
          </div>
        ) : filteredAndSortedFiles.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="w-12 h-12 text-omni-textDim mx-auto mb-4" />
              <h3 className="text-lg font-medium text-omni-text mb-2">
                {searchQuery || filterType !== 'all' ? 'No files found' : 'This folder is empty'}
              </h3>
              <p className="text-omni-textDim mb-4">
                {searchQuery 
                  ? `No files match "${searchQuery}"`
                  : filterType !== 'all'
                  ? `No ${filterType} files found`
                  : 'Upload files or create folders to get started'
                }
              </p>
              {!searchQuery && filterType === 'all' && (
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="omni-btn-primary flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Files
                  </button>
                  <button
                    onClick={() => setShowCreateFolder(true)}
                    className="omni-btn flex items-center gap-2"
                  >
                    <FolderPlus className="w-4 h-4" />
                    Create Folder
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <FileGrid files={filteredAndSortedFiles} />
        ) : (
          <FileList files={filteredAndSortedFiles} />
        )}
      </div>

      {/* Modals */}
      <CreateFolderModal
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onConfirm={handleCreateFolder}
      />

      <FilePreview
        open={previewOpen}
        onClose={() => useFilesStore.getState().closePreview()}
      />

      <ShareModal
        open={shareModal.open}
        file={shareModal.file}
        shareLink={shareModal.shareLink}
        onClose={() => useFilesStore.getState().closeShareModal()}
      />
    </div>
  );
};