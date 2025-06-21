import React from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/utils/cn";

export const TabContainer: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, removeTab } = useAppStore();
  const navigate = useNavigate();

  const handleTabClick = (tab: typeof tabs[0]) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    removeTab(tabId);
  };

  if (tabs.length === 0) return null;

  return (
    <div className="bg-omni-surface border-b border-omni-border">
      <div className="flex items-center px-2 overflow-x-auto scrollbar-hide">
        <AnimatePresence initial={false}>
          {tabs.map((tab) => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className={cn(
                  "group flex items-center gap-2 px-4 py-2 border-r border-omni-border",
                  "cursor-pointer transition-all duration-200 relative",
                  activeTabId === tab.id
                    ? "bg-omni-bg text-omni-cyan"
                    : "hover:bg-omni-surface2 text-omni-textDim hover:text-omni-text"
                )}
                onClick={() => handleTabClick(tab)}
              >
                <span className="text-sm font-medium whitespace-nowrap">
                  {tab.title}
                </span>

                {tab.closable && (
                  <button
                    onClick={(e) => handleTabClose(e, tab.id)}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      "hover:text-omni-red p-0.5 rounded"
                    )}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* Indicador activo */}
                {activeTabId === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-omni-cyan"
                  />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Separador de overflow */}
        <div className="flex-1 h-full border-r border-omni-border" />
      </div>
    </div>
  );
};
