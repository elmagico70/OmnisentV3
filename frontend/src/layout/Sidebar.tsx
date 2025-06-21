import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Search,
  Brain,
  Workflow,
  Shield,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Database,
  Globe,
  FileText,
} from "lucide-react";
import { useAppStore } from "@/store/appSlice";
import { cn } from "@/utils/cn";

interface NavItem {
  id: string;
  title: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
  color?: string;
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    color: "text-omni-cyan",
  },
  {
    id: "search",
    title: "Search Engine",
    icon: Search,
    path: "/search",
    color: "text-omni-green",
  },
  {
    id: "ai",
    title: "AI Assistant",
    icon: Brain,
    path: "/ai",
    badge: "GPT-4",
    color: "text-omni-purple",
  },
  {
    id: "automation",
    title: "Automation",
    icon: Workflow,
    path: "/automation",
    color: "text-omni-yellow",
  },
  {
    id: "files",
    title: "Files",
    icon: FolderOpen,
    path: "/files",
    color: "text-blue-400",
  },
  {
    id: "notes",
    title: "Notes",
    icon: FileText,
    path: "/notes",
    color: "text-yellow-400",
  },
  {
    id: "logger",
    title: "Logger",
    icon: Terminal,
    path: "/logger",
    color: "text-purple-400",
  },
  {
    id: "admin",
    title: "Admin Panel",
    icon: Shield,
    path: "/admin",
    color: "text-omni-red",
  },
];

const bottomNavItems: NavItem[] = [
  {
    id: "terminal",
    title: "Terminal",
    icon: Terminal,
    path: "/terminal",
  },
  {
    id: "database",
    title: "Database",
    icon: Database,
    path: "/database",
  },
  {
    id: "network",
    title: "Network",
    icon: Globe,
    path: "/network",
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, addTab } = useAppStore();
  const navigate = useNavigate();

  const handleNavClick = (item: NavItem) => {
    addTab({
      id: item.id,
      title: item.title,
      path: item.path,
      icon: item.title,
      closable: item.id !== "dashboard",
    });
    navigate(item.path);
  };

  return (
    <aside className="h-full bg-omni-surface border-r border-omni-border flex flex-col">
      {/* Navegación superior */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-1 px-2">
          {navItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <NavLink
                to={item.path}
                onClick={() => handleNavClick(item)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                    "hover:bg-omni-surface2 group relative",
                    isActive && "bg-omni-surface2 border border-omni-cyan/30"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        "w-5 h-5 transition-colors",
                        isActive ? item.color : "text-omni-textDim",
                        "group-hover:text-omni-text"
                      )}
                    />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 font-medium text-sm">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs bg-omni-cyan/20 text-omni-cyan rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-omni-cyan"
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </div>

        {/* Separador */}
        <div className="my-4 mx-4 h-px bg-omni-border" />

        {/* Navegación inferior */}
        <div className="space-y-1 px-2">
          {bottomNavItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <NavLink
                to={item.path}
                onClick={() => handleNavClick(item)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                    "hover:bg-omni-surface2 group",
                    isActive && "bg-omni-surface2"
                  )
                }
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 text-omni-textDim transition-colors",
                    "group-hover:text-omni-text"
                  )}
                />
                {!sidebarCollapsed && (
                  <span className="flex-1 font-medium text-sm">
                    {item.title}
                  </span>
                )}
              </NavLink>
            </motion.div>
          ))}
        </div>
      </nav>

      {/* Toggle de colapso */}
      <div className="p-2 border-t border-omni-border">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-omni-surface2 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-omni-textDim" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-omni-textDim" />
          )}
        </button>
      </div>

      {/* Estado del sistema */}
      <div className="px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-omni-green animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-omni-cyan animate-pulse delay-75" />
          <div className="w-1.5 h-1.5 rounded-full bg-omni-purple animate-pulse delay-150" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-xs text-omni-textDim">System Online</span>
        )}
      </div>
    </aside>
  );
};