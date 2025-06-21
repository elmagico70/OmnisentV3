// shared/components/ui/index.ts
export { Button } from './button';
export { Input } from './input';
export { Card } from './card';
export { Dialog } from './dialog';
export { DropdownMenu } from './dropdown-menu';
export { Tooltip } from './tooltip';
export { Badge } from './badge';
export { ScrollArea } from './scroll-area';

// shared/components/layout/AppShell.tsx
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/widgets/sidebar';
import { Header } from '@/widgets/header';
import { CommandPalette } from '@/widgets/command-palette';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.1)_0%,transparent_50%)]" />
      
      <div className="relative flex h-full">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          
          <main className="flex-1 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full p-6"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
      
      <CommandPalette />
    </div>
  );
};

// widgets/command-palette/CommandPalette.tsx
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/shared/components/ui/command';
import { 
  Search, 
  FileText, 
  FolderOpen, 
  Settings, 
  Calculator,
  Calendar,
  Brain
} from 'lucide-react';
import { create } from 'zustand';

interface CommandPaletteState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useCommandPalette = create<CommandPaletteState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));

const commandGroups = [
  {
    heading: "Navigation",
    commands: [
      { id: 'dashboard', title: 'Dashboard', icon: Search, action: '/dashboard' },
      { id: 'files', title: 'File Manager', icon: FolderOpen, action: '/files' },
      { id: 'notes', title: 'Notes', icon: FileText, action: '/notes' },
      { id: 'ai', title: 'AI Assistant', icon: Brain, action: '/ai' },
      { id: 'settings', title: 'Settings', icon: Settings, action: '/settings' },
    ]
  },
  {
    heading: "Tools",
    commands: [
      { id: 'calculator', title: 'Calculator', icon: Calculator, action: 'calculator' },
      { id: 'calendar', title: 'Calendar', icon: Calendar, action: 'calendar' },
    ]
  }
];

export const CommandPalette = () => {
  const { isOpen, close } = useCommandPalette();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useCommandPalette.getState().toggle();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const filteredGroups = useMemo(() => {
    if (!search) return commandGroups;
    
    return commandGroups.map(group => ({
      ...group,
      commands: group.commands.filter(cmd => 
        cmd.title.toLowerCase().includes(search.toLowerCase())
      )
    })).filter(group => group.commands.length > 0);
  }, [search]);

  const handleSelect = (action: string) => {
    close();
    setSearch('');
    
    if (action.startsWith('/')) {
      navigate(action);
    } else {
      // Handle special actions
      switch (action) {
        case 'calculator':
          // Open calculator modal
          break;
        case 'calendar':
          // Open calendar view
          break;
      }
    }
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={close}>
      <div className="bg-slate-900 border border-slate-700">
        <CommandInput
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
          className="border-0 bg-transparent text-slate-100 placeholder:text-slate-400"
        />
        <CommandList className="bg-slate-900">
          <CommandEmpty className="text-slate-400 py-6 text-center">
            No results found.
          </CommandEmpty>
          
          <AnimatePresence>
            {filteredGroups.map((group, groupIndex) => (
              <motion.div
                key={group.heading}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: groupIndex * 0.05 }}
              >
                <CommandGroup 
                  heading={group.heading}
                  className="text-slate-400 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                >
                  {group.commands.map((command) => (
                    <CommandItem
                      key={command.id}
                      onSelect={() => handleSelect(command.action)}
                      className="text-slate-200 data-[selected]:bg-slate-800 data-[selected]:text-cyan-400 px-2 py-2 cursor-pointer"
                    >
                      <command.icon className="mr-2 h-4 w-4" />
                      <span>{command.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {groupIndex < filteredGroups.length - 1 && (
                  <CommandSeparator className="bg-slate-700" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </CommandList>
      </div>
    </CommandDialog>
  );
};sidebar/Sidebar.tsx
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  FolderOpen, 
  FileText, 
  Brain,
  Settings,
  Shield
} from 'lucide-react';
import { useAuth } from '@/entities/auth';
import { cn } from '@/shared/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Files', href: '/files', icon: FolderOpen },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Notes', href: '/notes', icon: FileText },
  { name: 'AI Assistant', href: '/ai', icon: Brain },
];

const adminNavigation = [
  { name: 'Admin Panel', href: '/admin', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const { user, isAdmin } = useAuth();

  return (
    <motion.aside 
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="w-70 bg-slate-900/50 backdrop-blur border-r border-slate-800"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            OMNISENT
          </span>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
          
          {isAdmin() && (
            <>
              <div className="my-4 border-t border-slate-800" />
              {adminNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-red-500/20 text-red-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </div>

      {/* User Profile */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
          <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {user?.username}
            </p>
            <p className="text-xs text-slate-400 capitalize">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

// widgets/header/Header.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Command, Bell, Settings } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useCommandPalette } from '@/widgets/command-palette';

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { open } = useCommandPalette();

  return (
    <header className="h-16 bg-slate-900/30 backdrop-blur border-b border-slate-800 flex items-center px-6 gap-4">
      {/* Search Bar */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search everything... (⌘K)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={open}
          className="pl-10 bg-slate-800/50 border-slate-700 focus:border-cyan-500"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <kbd className="px-1.5 py-0.5 text-xs bg-slate-700 rounded border border-slate-600">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-slate-400">
          <Bell className="w-4 h-4" />
        </Button>
        
        <Button variant="ghost" size="sm" className="text-slate-400">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

// widgets/