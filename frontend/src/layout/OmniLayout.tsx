import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { Sidebar } from "@/components/Sidebar";
import { TabContainer } from "@/components/TabContainer";
import { Header } from "@/components/Header";
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Zap,
  Command,
  Search
} from "lucide-react";

interface OmniLayoutProps {
  children?: React.ReactNode;
}

export const OmniLayout: React.FC<OmniLayoutProps> = () => {
  const { sidebarCollapsed, theme } = useAppStore();
  const location = useLocation();
  const { scrollY } = useScroll();
  
  // Estados para funcionalidades mejoradas
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [systemLoad, setSystemLoad] = useState(0);

  // Transformaciones basadas en scroll
  const headerOpacity = useTransform(scrollY, [0, 50], [1, 0.95]);
  const backgroundY = useTransform(scrollY, [0, 500], [0, -50]);

  // Efecto de mouse tracking para el cursor glow
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  // Simulador de carga del sistema
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemLoad(prev => {
        const change = (Math.random() - 0.5) * 10;
        return Math.max(0, Math.min(100, prev + change));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Event listeners
  useEffect(() => {
    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('mousemove', handleMouseMove);

    // Command palette hotkey
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseMove]);

  // Variantes de animación para transiciones de página
  const pageVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.98
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1]
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      scale: 0.98,
      transition: {
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  const sidebarVariants = {
    expanded: {
      width: 280,
      transition: {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1]
      }
    },
    collapsed: {
      width: 72,
      transition: {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-omni-bg overflow-hidden relative">
      {/* Cursor glow effect */}
      <motion.div
        className="fixed pointer-events-none z-50 mix-blend-difference"
        animate={{
          x: mousePosition.x - 8,
          y: mousePosition.y - 8,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
      >
        <div className="w-4 h-4 bg-omni-cyan rounded-full opacity-50 blur-sm" />
      </motion.div>

      {/* Enhanced animated background */}
      <motion.div 
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ y: backgroundY }}
      >
        {/* Grid pattern */}
        <div className="absolute inset-0 omni-grid-bg opacity-[0.02]" />
        
        {/* Floating orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-omni-cyan/5 to-blue-500/5 rounded-full blur-3xl"
        />
        
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl"
        />
      </motion.div>

      {/* Status bar */}
      <motion.div 
        style={{ opacity: headerOpacity }}
        className="absolute top-0 right-4 z-40 flex items-center space-x-2 text-xs text-omni-text-secondary bg-omni-surface/80 backdrop-blur-sm rounded-b-lg px-3 py-1"
      >
        <div className="flex items-center space-x-1">
          {isOnline ? (
            <Wifi className="w-3 h-3 text-green-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-400" />
          )}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        
        <div className="w-px h-3 bg-omni-border" />
        
        <div className="flex items-center space-x-1">
          <Activity className="w-3 h-3 text-omni-cyan" />
          <span>{systemLoad.toFixed(0)}%</span>
        </div>
        
        <div className="w-px h-3 bg-omni-border" />
        
        <div className="flex items-center space-x-1">
          <Command className="w-3 h-3" />
          <span>Ctrl+K</span>
        </div>
      </motion.div>

      {/* Enhanced header */}
      <motion.div
        style={{ opacity: headerOpacity }}
        className="relative z-30"
      >
        <Header />
      </motion.div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Enhanced sidebar */}
        <motion.div
          variants={sidebarVariants}
          animate={sidebarCollapsed ? "collapsed" : "expanded"}
          className="relative z-20 flex-shrink-0"
        >
          <div className="h-full relative">
            {/* Sidebar glow effect */}
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-omni-cyan/20 to-transparent" />
            <Sidebar />
          </div>
        </motion.div>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Tab container with enhanced styling */}
          <div className="relative z-10">
            <TabContainer />
          </div>

          {/* Main content with page transitions */}
          <main className="flex-1 overflow-hidden bg-gradient-to-br from-omni-bg via-omni-bg to-omni-bg/95 relative">
            <AnimatePresence mode="wait" key={location.pathname}>
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="h-full relative"
              >
                {/* Content wrapper */}
                <div className="h-full overflow-auto">
                  <div className="p-6 h-full relative">
                    {/* Page indicator */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="absolute top-4 left-4 w-2 h-2 bg-omni-cyan rounded-full animate-pulse z-10"
                    />
                    
                    <Outlet />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Enhanced scan line effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
        <motion.div
          animate={{
            y: ["-100vh", "100vh"],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
          className="w-full h-px bg-gradient-to-r from-transparent via-omni-cyan/30 to-transparent scan-line"
        />
      </div>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-32"
            onClick={() => setCommandPaletteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-omni-surface border border-omni-border rounded-xl p-4 w-full max-w-lg mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <Search className="w-5 h-5 text-omni-text-secondary" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar o ejecutar comando..."
                  className="flex-1 bg-transparent text-omni-text-primary placeholder-omni-text-secondary outline-none"
                />
              </div>
              
              <div className="text-sm text-omni-text-secondary">
                <p>Comando rápido disponible próximamente...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance indicator */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed bottom-4 right-4 z-40"
      >
        <div className="bg-omni-surface/80 backdrop-blur-sm border border-omni-border rounded-lg p-2 text-xs text-omni-text-secondary">
          <div className="flex items-center space-x-2">
            <Zap className="w-3 h-3 text-omni-cyan" />
            <span>System: {systemLoad.toFixed(0)}%</span>
            <div className={`w-2 h-2 rounded-full ${
              systemLoad < 30 ? 'bg-green-400' : 
              systemLoad < 70 ? 'bg-yellow-400' : 'bg-red-400'
            } animate-pulse`} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};