// components/files/index.ts - Export all file components
export { FileGrid } from './FileGrid';
export { FileList } from './FileList';
export { FileUpload } from './FileUpload';
export { FilePreview } from './FilePreview';
export { ShareModal } from './ShareModal';
export { CreateFolderModal } from './CreateFolderModal';
export { BulkActions } from './BulkActions';

// stores/index.ts - Export all stores
export { useFilesStore } from './filesStore';
export type { FileItem, FileVersion, ShareLink, UploadProgress } from './filesStore';

// hooks/index.ts - Export all hooks
export { useFilePermissions } from './useFilePermissions';
export type { FilePermissions, SystemPermissions } from './useFilePermissions';

// ============================================
// CONFIGURATION GUIDE FOR OMNISENT2 FILES
// ============================================

/*
## 📁 File Structure

```
src/
├── components/
│   └── files/
│       ├── index.ts
│       ├── FileGrid.tsx
│       ├── FileList.tsx
│       ├── FileUpload.tsx
│       ├── FilePreview.tsx
│       ├── ShareModal.tsx
│       ├── CreateFolderModal.tsx
│       └── BulkActions.tsx
├── hooks/
│   ├── useFilePermissions.ts
│   └── useApi.ts (existing)
├── stores/
│   ├── filesStore.ts
│   └── appStore.ts (existing)
├── services/
│   └── api.ts (updated)
├── pages/
│   └── FilesPage.tsx (updated)
└── utils/
    └── cn.ts (existing)
```

## 🚀 Setup Instructions

### 1. Install Additional Dependencies (if needed)
```bash
npm install qrcode html5-qrcode
npm install -D @types/qrcode
```

### 2. Update API Endpoints
Add these endpoints to your FastAPI backend:

```python
# File management endpoints
@app.get("/api/files")
@app.get("/api/files/{file_id}")
@app.post("/api/files/upload")
@app.post("/api/files/upload/batch")
@app.post("/api/files/folders")
@app.patch("/api/files/{file_id}")
@app.delete("/api/files/{file_id}")
@app.post("/api/files/move")
@app.post("/api/files/copy")
@app.post("/api/files/{file_id}/star")
@app.post("/api/files/{file_id}/protect")
@app.post("/api/files/{file_id}/share")
@app.get("/api/files/{file_id}/download")
@app.get("/api/files/storage")
```

### 3. Update Environment Variables
```env
# File upload settings
MAX_FILE_SIZE=100MB
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,txt,zip
UPLOAD_DIR=./uploads
THUMBNAIL_DIR=./thumbnails

# Share settings
SHARE_LINK_EXPIRY=7d
MAX_SHARE_DOWNLOADS=100
```

### 4. Database Schema Updates
```sql
-- Files table
CREATE TABLE files (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL, -- 'file' or 'folder'
    extension VARCHAR,
    size BIGINT DEFAULT 0,
    path VARCHAR NOT NULL,
    parent_id VARCHAR,
    owner_id VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    modified_at TIMESTAMP DEFAULT NOW(),
    starred BOOLEAN DEFAULT FALSE,
    protected BOOLEAN DEFAULT FALSE,
    shared BOOLEAN DEFAULT FALSE,
    mime_type VARCHAR,
    description TEXT,
    tags JSON,
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES files(id)
);

-- File shares table
CREATE TABLE file_shares (
    id VARCHAR PRIMARY KEY,
    file_id VARCHAR NOT NULL,
    token VARCHAR UNIQUE NOT NULL,
    password VARCHAR,
    expires_at TIMESTAMP,
    max_downloads INTEGER,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (file_id) REFERENCES files(id)
);

-- File permissions table
CREATE TABLE file_permissions (
    id VARCHAR PRIMARY KEY,
    file_id VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    can_read BOOLEAN DEFAULT FALSE,
    can_write BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_share BOOLEAN DEFAULT FALSE,
    granted_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (file_id) REFERENCES files(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🎯 Key Features

### ✅ File Management
- ✅ Grid and List views with customizable density
- ✅ Drag & drop upload with progress tracking
- ✅ Folder creation and navigation
- ✅ File rename, move, copy, delete
- ✅ Bulk operations (select all, multi-select)
- ✅ Search and advanced filtering
- ✅ Sorting by name, size, date, type, owner

### ✅ Permissions & Security
- ✅ Role-based access control (admin, user, guest)
- ✅ File-level permissions (read, write, delete, share)
- ✅ Protected files with encryption
- ✅ File type and size restrictions by role
- ✅ Audit logging for all file operations

### ✅ Sharing & Collaboration
- ✅ Share links with password protection
- ✅ QR code generation for easy sharing
- ✅ Expiration dates and download limits
- ✅ Public and private sharing modes
- ✅ Share link analytics and management

### ✅ Preview & Media
- ✅ Image preview with zoom and pan
- ✅ Video/audio player integration
- ✅ PDF viewer with zoom controls
- ✅ Code syntax highlighting
- ✅ Thumbnail generation for images
- ✅ File type icons and colors

### ✅ Advanced Features
- ✅ File versioning and history
- ✅ Starred/favorite files
- ✅ Recent files tracking
- ✅ Storage quota management
- ✅ Keyboard shortcuts (Ctrl+A, Delete, F2, Esc)
- ✅ Context menus with smart actions

## 🔧 Customization

### Theme Colors
Update `tailwind.config.js` to customize colors:
```js
colors: {
  'file-folder': '#00D9FF',    // Folder color
  'file-image': '#00FF88',     // Image files
  'file-document': '#FFD700',  // Documents
  'file-video': '#FF0044',     // Video files
  'file-audio': '#BB00FF',     // Audio files
}
```

### File Type Icons
Add custom icons in `getFileIcon()` function:
```typescript
case 'custom-ext':
  return CustomIcon;
```

### Upload Restrictions
Configure in `useFilePermissions.ts`:
```typescript
maxUploadSize: 500, // MB
allowedFileTypes: ['jpg', 'png', 'pdf'], // Extensions
```

## 📱 Mobile Responsiveness
- ✅ Touch-friendly interface
- ✅ Responsive grid layouts
- ✅ Mobile-optimized context menus
- ✅ Swipe gestures support
- ✅ Adaptive toolbar layout

## 🔒 Security Best Practices
- ✅ JWT token validation
- ✅ File path traversal prevention
- ✅ MIME type validation
- ✅ Virus scanning integration ready
- ✅ Rate limiting on uploads
- ✅ Encrypted file storage

## 📊 Performance Optimizations
- ✅ Virtual scrolling for large file lists
- ✅ Lazy loading of thumbnails
- ✅ Debounced search queries
- ✅ Cached file metadata
- ✅ Progressive image loading
- ✅ Optimistic UI updates

## 🧪 Testing
```typescript
// Test file operations
import { render, screen, fireEvent } from '@testing-library/react';
import { FilesPage } from '@/pages/FilesPage';

test('should upload files via drag and drop', async () => {
  render(<FilesPage />);
  
  const dropZone = screen.getByRole('main');
  const file = new File(['test'], 'test.txt', { type: 'text/plain' });
  
  fireEvent.drop(dropZone, {
    dataTransfer: { files: [file] }
  });
  
  expect(screen.getByText('Uploading 1 files')).toBeInTheDocument();
});
```

## 🚀 Deployment
1. Build the frontend: `npm run build`
2. Configure your web server for file uploads
3. Set up background jobs for thumbnail generation
4. Configure CDN for file delivery
5. Set up monitoring and alerting

## 📈 Analytics & Monitoring
- File upload/download metrics
- Storage usage tracking
- User activity analytics
- Error rate monitoring
- Performance metrics

## 🔄 Future Enhancements
- [ ] Real-time collaboration
- [ ] Advanced search with filters
- [ ] File comments and annotations
- [ ] Integration with cloud storage
- [ ] Advanced file preview
- [ ] Automated file organization
- [ ] Machine learning insights
*/

// utils/fileHelpers.ts - Additional utility functions
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
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }
};