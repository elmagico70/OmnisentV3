// components/files/BulkActions.tsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Download,
  Trash2,
  Move,
  Copy,
  Star,
  Share2,
  Archive,
} from 'lucide-react';
import { useFilesStore } from '@/store/filesStore';
import { useFilePermissions } from '@/hooks/useFilePermissions';

interface BulkActionsProps {
  selectedFiles: string[];
  onClearSelection: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedFiles,
  onClearSelection
}) => {
  const { files, deleteFiles } = useFilesStore();
  const { systemPermissions } = useFilePermissions();

  const selectedFileObjects = files.filter(f => selectedFiles.includes(f.id));
  const allCanDelete = selectedFileObjects.every(file => {
    const { canPerformAction } = useFilePermissions(file);
    return canPerformAction('canDelete');
  });

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedFiles.length} files?`)) {
      await deleteFiles(selectedFiles);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-omni-surface border border-omni-border rounded-lg p-4 mb-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-omni-text">
            {selectedFiles.length} files selected
          </span>
          
          <div className="flex items-center gap-1">
            <button
              className="omni-btn text-sm flex items-center gap-2"
              title="Download selected"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            
            <button
              className="omni-btn text-sm flex items-center gap-2"
              title="Share selected"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            
            <button
              className="omni-btn text-sm flex items-center gap-2"
              title="Add to favorites"
            >
              <Star className="w-4 h-4" />
              Star
            </button>
            
            {allCanDelete && (
              <button
                onClick={handleBulkDelete}
                className="omni-btn text-sm flex items-center gap-2 text-omni-red hover:bg-omni-red/20"
                title="Delete selected"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={onClearSelection}
          className="p-2 rounded-lg hover:bg-omni-surface2 transition-colors"
          title="Clear selection"
        >
          <X className="w-4 h-4 text-omni-textDim" />
        </button>
      </div>
    </motion.div>
  );
};