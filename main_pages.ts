// pages/dashboard/DashboardPage.tsx
import { motion } from 'framer-motion';
import { useQuery } from '@/shared/hooks/useQuery';
import { apiClient } from '@/shared/api/client';
import { Card } from '@/shared/components/ui/card';
import { SystemMetrics } from './components/SystemMetrics';
import { QuickActions } from './components/QuickActions';
import { RecentActivity } from './components/RecentActivity';
import { WelcomeHeader } from './components/WelcomeHeader';

interface DashboardData {
  metrics: {
    filesCount: number;
    notesCount: number;
    tasksCount: number;
    storageUsed: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'file' | 'note' | 'search';
    description: string;
    timestamp: string;
  }>;
  systemHealth: {
    cpu: number;
    memory: number;
    disk: number;
    uptime: string;
  };
}

export const DashboardPage = () => {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get('/dashboard').then(res => res.data),
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6 bg-red-950/50 border-red-500/50">
          <p className="text-red-400">Failed to load dashboard data</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WelcomeHeader />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <SystemMetrics data={data?.metrics} />
          <RecentActivity activities={data?.recentActivity || []} />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <QuickActions />
          {data?.systemHealth && (
            <Card className="p-6 bg-slate-900/50 border-slate-700">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">System Health</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">CPU</span>
                  <span className="text-cyan-400">{data.systemHealth.cpu}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Memory</span>
                  <span className="text-cyan-400">{data.systemHealth.memory}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Disk</span>
                  <span className="text-cyan-400">{data.systemHealth.disk}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Uptime</span>
                  <span className="text-green-400">{data.systemHealth.uptime}</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// pages/files/FilesPage.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileExplorer } from '@/entities/files';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { 
  Grid3X3, 
  List, 
  Search, 
  Upload, 
  FolderPlus,
  Filter
} from 'lucide-react';

export const FilesPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Files</h1>
          <p className="text-slate-400 mt-1">Manage your files and folders</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button variant="outline" size="sm">
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* File Explorer */}
      <div className="flex-1 overflow-hidden">
        <FileExplorer />
      </div>
    </div>
  );
};

// pages/notes/NotesPage.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNotesStore } from '@/entities/notes/store/notes.store';
import { NoteEditor } from '@/entities/notes/components/NoteEditor';
import { NotesList } from '@/entities/notes/components/NotesList';
import { NotesToolbar } from '@/entities/notes/components/NotesToolbar';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';

export const NotesPage = () => {
  const { 
    notes, 
    activeNote, 
    isLoading, 
    loadNotes, 
    createNote, 
    setActiveNote 
  } = useNotesStore();

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleCreateNote = async () => {
    await createNote('Untitled Note');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-200">Notes</h2>
            <Button size="sm" onClick={handleCreateNote}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <NotesToolbar />
        </div>
        
        <div className="flex-1 overflow-auto">
          <NotesList 
            notes={notes}
            activeNote={activeNote}
            onSelectNote={setActiveNote}
          />
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        {activeNote ? (
          <NoteEditor note={activeNote} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-slate-400 mb-4">Select a note to start editing</div>
              <Button onClick={handleCreateNote}>
                <Plus className="w-4 h-4 mr-2" />
                Create your first note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// pages/search/SearchPage.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@/shared/hooks/useQuery';
import { apiClient } from '@/shared/api/client';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Search, Filter, Clock, FileText, User } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'file' | 'note' | 'user' | 'email';
  title: string;
  content: string;
  source: string;
  timestamp: string;
  relevance: number;
}

export const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<string[]>([]);

  const { data: results, isLoading } = useQuery<SearchResult[]>({
    queryKey: ['search', query, filters],
    queryFn: () => apiClient.get('/search', { 
      params: { q: query, filters: filters.join(',') } 
    }).then(res => res.data),
    enabled: query.length > 2,
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'file': return FileText;
      case 'note': return FileText;
      case 'user': return User;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'file': return 'bg-blue-500/20 text-blue-400';
      case 'note': return 'bg-green-500/20 text-green-400';
      case 'user': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Search</h1>
        <p className="text-slate-400 mt-1">Find anything across your data</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Search files, notes, emails..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-12 pr-4 py-4 text-lg bg-slate-800/50 border-slate-700"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {['files', 'notes', 'emails', 'users'].map((filter) => (
          <Badge
            key={filter}
            variant={filters.includes(filter) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => {
              setFilters(prev => 
                prev.includes(filter) 
                  ? prev.filter(f => f !== filter)
                  : [...prev, filter]
              );
            }}
          >
            {filter}
          </Badge>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
          </div>
        )}

        {results?.map((result) => {
          const Icon = getTypeIcon(result.type);
          return (
                          <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-slate-200">{result.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {result.type}
                      </Badge>
                    </div>
                    
                    <p className="text-slate-400 text-sm mb-2 line-clamp-2">
                      {result.content}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(result.timestamp).toLocaleDateString()}
                      </span>
                      <span>Source: {result.source}</span>
                      <span>Relevance: {Math.round(result.relevance * 100)}%</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}

        {query.length > 2 && !isLoading && (!results || results.length === 0) && (
          <div className="text-center py-8">
            <p className="text-slate-400">No results found for "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

// pages/admin/AdminPage.tsx
import { Refine } from '@refinedev/core';
import { RefineSnackbarProvider } from '@refinedev/mui';
import { dataProvider } from '@/shared/lib/refine-data-provider';
import { UsersList } from './components/UsersList';
import { FilesList } from './components/FilesList';
import { LogsList } from './components/LogsList';
import { SettingsPanel } from './components/SettingsPanel';
import { AdminDashboard } from './components/AdminDashboard';

export const AdminPage = () => {
  return (
    <Refine
      dataProvider={dataProvider}
      routerProvider={{
        routes: [
          { path: '/admin', element: <AdminDashboard /> },
          { path: '/admin/users', element: <UsersList /> },
          { path: '/admin/files', element: <FilesList /> },
          { path: '/admin/logs', element: <LogsList /> },
          { path: '/admin/settings', element: <SettingsPanel /> },
        ]
      }}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
      }}
    >
      <RefineSnackbarProvider>
        <div className="h-full">
          <AdminRoutes />
        </div>
      </RefineSnackbarProvider>
    </Refine>
  );
};
              