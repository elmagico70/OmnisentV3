// components/files/FilePreview.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Share2,
  Star,
  Eye,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useFilesStore } from '@/store/filesSlice';
import { useFilePermissions } from '@/hooks/useFilePermissions';

interface FilePreviewProps {
  open: boolean;
  onClose: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ open, onClose }) => {
  const { previewFile, openShareModal, toggleStar } = useFilesStore();
  const { canPerformAction } = useFilePermissions(previewFile);

  if (!open || !previewFile) return null;

  const renderPreview = () => {
    if (!previewFile.url) {
      return (
        <div className="flex items-center justify-center h-96 text-omni-textDim">
          <div className="text-center">
            <Eye className="w-12 h-12 mx-auto mb-4" />
            <p>Preview not available</p>
          </div>
        </div>
      );
    }

    // Image preview
    if (previewFile.mimeType?.startsWith('image/')) {
      return (
        <img
          src={previewFile.url}
          alt={previewFile.name}
          className="max-w-full max-h-96 object-contain mx-auto"
        />
      );
    }

    // Video preview
    if (previewFile.mimeType?.startsWith('video/')) {
      return (
        <video
          src={previewFile.url}
          controls
          className="max-w-full max-h-96 mx-auto"
        >
          Your browser does not support video playback.
        </video>
      );
    }

    // Audio preview
    if (previewFile.mimeType?.startsWith('audio/')) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Music className="w-16 h-16 text-omni-cyan mx-auto mb-4" />
            <audio src={previewFile.url} controls className="mx-auto" />
          </div>
        </div>
      );
    }

    // PDF preview (using iframe)
    if (previewFile.extension === 'pdf') {
      return (
        <iframe
          src={previewFile.url}
          className="w-full h-96 border border-omni-border rounded"
          title={previewFile.name}
        />
      );
    }

    // Text preview
    if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts'].includes(previewFile.extension || '')) {
      return (
        <div className="h-96 overflow-auto">
          <iframe
            src={previewFile.url}
            className="w-full h-full border border-omni-border rounded"
            title={previewFile.name}
          />
        </div>
      );
    }

    // Default preview
    return (
      <div className="flex items-center justify-center h-96 text-omni-textDim">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4" />
          <p className="mb-4">Preview not available for this file type</p>
          <button
            onClick={() => window.open(previewFile.url, '_blank')}
            className="omni-btn-primary flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open in new tab
          </button>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-omni-surface border border-omni-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-omni-border">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-lg font-semibold text-omni-text">
                  {previewFile.name}
                </h3>
                <p className="text-sm text-omni-textDim">
                  {previewFile.size && `${(previewFile.size / 1024 / 1024).toFixed(2)} MB`}
                  {previewFile.extension && ` • ${previewFile.extension.toUpperCase()}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {canPerformAction('canDownload') && (
                <button
                  onClick={() => window.open(previewFile.url, '_blank')}
                  className="omni-btn flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
              
              {canPerformAction('canShare') && (
                <button
                  onClick={() => openShareModal(previewFile)}
                  className="omni-btn flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              )}
              
              {canPerformAction('canEdit') && (
                <button
                  onClick={() => toggleStar(previewFile.id)}
                  className={cn(
                    "omni-btn flex items-center gap-2",
                    previewFile.starred && "text-omni-yellow"
                  )}
                >
                  <Star className={cn("w-4 h-4", previewFile.starred && "fill-current")} />
                  {previewFile.starred ? 'Starred' : 'Star'}
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-omni-surface2 transition-colors"
              >
                <X className="w-4 h-4 text-omni-textDim" />
              </button>
            </div>
          </div>
          
          {/* Preview content */}
          <div className="p-6">
            {renderPreview()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};