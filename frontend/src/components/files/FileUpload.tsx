// components/files/FileUpload.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  File,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { UploadProgress, useFilesStore } from '@/store/filesStore';

interface FileUploadProps {
  uploadQueue: UploadProgress[];
}

export const FileUpload: React.FC<FileUploadProps> = ({ uploadQueue }) => {
  const { cancelUpload, retryUpload } = useFilesStore();

  if (uploadQueue.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-omni-surface border border-omni-border rounded-lg p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-omni-cyan" />
          <h3 className="font-medium text-omni-text">
            Uploading {uploadQueue.length} files
          </h3>
        </div>
      </div>
      
      <div className="space-y-2">
        <AnimatePresence>
          {uploadQueue.map((upload) => (
            <motion.div
              key={upload.fileId}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 p-2 bg-omni-surface2 rounded-lg"
            >
              <File className="w-4 h-4 text-omni-textDim flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-omni-text truncate">
                  {upload.fileName}
                </p>
                
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-omni-surface rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${upload.progress}%` }}
                      className={cn(
                        "h-full transition-colors",
                        upload.status === 'completed' && "bg-omni-green",
                        upload.status === 'error' && "bg-omni-red",
                        upload.status === 'uploading' && "bg-omni-cyan",
                        upload.status === 'cancelled' && "bg-omni-textDim"
                      )}
                    />
                  </div>
                  <span className="text-xs text-omni-textDim w-10 text-right">
                    {upload.progress}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {upload.status === 'completed' && (
                  <CheckCircle className="w-4 h-4 text-omni-green" />
                )}
                {upload.status === 'error' && (
                  <button
                    onClick={() => retryUpload(upload.fileId)}
                    className="p-1 rounded hover:bg-omni-surface hover:text-omni-cyan transition-colors"
                    title="Retry upload"
                  >
                    <RefreshCw className="w-4 h-4 text-omni-red" />
                  </button>
                )}
                {upload.status === 'uploading' && (
                  <button
                    onClick={() => cancelUpload(upload.fileId)}
                    className="p-1 rounded hover:bg-omni-surface hover:text-omni-red transition-colors"
                    title="Cancel upload"
                  >
                    <X className="w-4 h-4 text-omni-textDim" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};