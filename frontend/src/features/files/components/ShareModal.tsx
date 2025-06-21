// components/files/ShareModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  X,
  Copy,
  Download,
  Calendar,
  Lock,
  QrCode,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { FileItem, ShareLink, useFilesStore } from '@/store/filesSlice';

interface ShareModalProps {
  open: boolean;
  file: FileItem | null;
  shareLink: ShareLink | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  open,
  file,
  shareLink,
  onClose
}) => {
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxDownloads, setMaxDownloads] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { createShareLink, revokeShareLink } = useFilesStore();

  const handleCreateLink = async () => {
    if (!file) return;
    
    const options: any = {};
    if (password) options.password = password;
    if (expiresAt) options.expiresAt = expiresAt;
    if (maxDownloads) options.maxDownloads = parseInt(maxDownloads);
    
    try {
      await createShareLink(file.id, options);
    } catch (error) {
      console.error('Error creating share link:', error);
    }
  };

  const handleCopyLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevokeLink = async () => {
    if (shareLink) {
      await revokeShareLink(shareLink.id);
    }
  };

  if (!open || !file) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-omni-surface border border-omni-border rounded-xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Share2 className="w-6 h-6 text-omni-cyan" />
              <div>
                <h3 className="text-lg font-semibold text-omni-text">Share File</h3>
                <p className="text-sm text-omni-textDim truncate">{file.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-omni-surface2 transition-colors"
            >
              <X className="w-4 h-4 text-omni-textDim" />
            </button>
          </div>

          {shareLink ? (
            <div className="space-y-4">
              {/* Existing share link */}
              <div className="p-4 bg-omni-surface2 rounded-lg">
                <h4 className="font-medium text-omni-text mb-2">Share Link</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareLink.token}
                    readOnly
                    className="flex-1 omni-input text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      copied 
                        ? "bg-omni-green/20 text-omni-green" 
                        : "bg-omni-cyan/20 text-omni-cyan hover:bg-omni-cyan/30"
                    )}
                  >
                    {copied ? 'Copied!' : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Link stats */}
                <div className="flex items-center justify-between text-xs text-omni-textDim mt-2">
                  <span>{shareLink.downloads} downloads</span>
                  {shareLink.expiresAt && (
                    <span>Expires: {new Date(shareLink.expiresAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {/* QR Code */}
              {shareLink.qrCode && (
                <div className="text-center">
                  <img
                    src={shareLink.qrCode}
                    alt="QR Code"
                    className="w-32 h-32 mx-auto bg-white rounded-lg p-2"
                  />
                  <p className="text-xs text-omni-textDim mt-2">
                    Scan to access file
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 omni-btn-primary flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Link
                </button>
                <button
                  onClick={handleRevokeLink}
                  className="omni-btn text-omni-red hover:bg-omni-red/20"
                >
                  Revoke
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Create share link form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-omni-text mb-1">
                    Password Protection (optional)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="omni-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-omni-textDim hover:text-omni-text"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-omni-text mb-1">
                    Expiration Date (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="omni-input"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-omni-text mb-1">
                    Max Downloads (optional)
                  </label>
                  <input
                    type="number"
                    value={maxDownloads}
                    onChange={(e) => setMaxDownloads(e.target.value)}
                    placeholder="Unlimited"
                    min="1"
                    className="omni-input"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateLink}
                className="w-full omni-btn-primary flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Create Share Link
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};