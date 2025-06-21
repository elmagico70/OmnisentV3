import React from "react";
import {
  Search,
  Terminal,
  User,
  Bell,
  Settings,
  Moon,
  Sun,
} from "lucide-react";
import { useAppStore } from "@/store/appSlice";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

export const Header: React.FC = () => {
  const { theme, setTheme, user } = useAppStore();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    document.documentElement.classList.toggle("dark", theme !== "dark");
  };

  return (
    <header className="h-14 bg-omni-surface border-b border-omni-border flex items-center px-4 gap-4 relative">
      {/* Logo y título */}
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 180 }}
          transition={{ duration: 0.3 }}
          className="w-8 h-8 bg-gradient-to-br from-omni-cyan to-omni-green rounded-lg flex items-center justify-center"
        >
          <Terminal className="w-5 h-5 text-omni-bg" />
        </motion.div>
        <h1 className="text-xl font-bold font-mono">
          <span className="text-gradient">OMNISENT</span>
        </h1>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex-1 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-omni-textDim" />
          <input
            type="text"
            placeholder="Search everywhere... (Ctrl+K)"
            className="omni-input pl-10 pr-4 w-full"
          />
        </div>
      </div>

      {/* Acciones lado derecho */}
      <div className="flex items-center gap-2">
        {/* Notificaciones */}
        <button className="p-2 rounded hover:bg-omni-surface2 transition-colors relative">
          <Bell className="w-4 h-4 text-omni-textDim" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-omni-red rounded-full animate-pulse" />
        </button>

        {/* Toggle de tema */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded hover:bg-omni-surface2 transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-omni-textDim" />
          ) : (
            <Moon className="w-4 h-4 text-omni-textDim" />
          )}
        </button>

        {/* Configuración */}
        <button className="p-2 rounded hover:bg-omni-surface2 transition-colors">
          <Settings className="w-4 h-4 text-omni-textDim" />
        </button>

        {/* Usuario */}
        <div className="flex items-center gap-2 pl-2 border-l border-omni-border">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-omni-cyan to-omni-purple flex items-center justify-center">
            <User className="w-4 h-4 text-omni-bg" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-omni-text">
              {user?.name || "Guest User"}
            </p>
            <p className="text-omni-textDim text-xs">
              {user?.role || "Limited Access"}
            </p>
          </div>
        </div>
      </div>

      {/* Línea decorativa inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-omni-cyan to-transparent opacity-50" />
    </header>
  );
};
