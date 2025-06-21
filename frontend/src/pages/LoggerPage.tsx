import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, AlertCircle, CheckCircle, XCircle, Info, Copy,
  Search, Download, Check, Bug, RefreshCw, Code2
} from "lucide-react";
import { cn } from "@/utils/cn";
import { apiClient } from "@/services/api";
import { useApi } from "@/hooks/useApi";

type LogLevel = "info" | "warning" | "error" | "success" | "debug";

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  module: string;
  message: string;
  details?: string;
  stack?: string;
  user?: string;
  ip?: string;
  env?: string;
}

const getIconForLevel = (level: string): JSX.Element => {
  const icons: Record<string, JSX.Element> = {
    info: <Info className="w-4 h-4" />,
    warning: <AlertCircle className="w-4 h-4" />,
    error: <XCircle className="w-4 h-4" />,
    success: <CheckCircle className="w-4 h-4" />,
    debug: <Bug className="w-4 h-4" />,
  };
  return icons[level] || <Terminal className="w-4 h-4" />;
};

const getColorForLevel = (level: string): string => {
  const colors: Record<string, string> = {
    info: "text-omni-cyan",
    warning: "text-omni-yellow",
    error: "text-omni-red",
    success: "text-omni-green",
    debug: "text-purple-400",
  };
  return colors[level] || "text-omni-textDim";
};

const LoggerPage: React.FC = () => {
  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // Usar useApi para manejar la carga de logs
  const { 
    data: logs = [], 
    loading, 
    error, 
    execute: fetchLogs 
  } = useApi(
    () => apiClient.logs.getLogs({
      level: filter !== "all" ? filter : undefined,
      limit: 100
    }),
    {
      immediate: false,
      onError: (error) => {
        console.error('Error fetching logs:', error);
      }
    }
  );

  // Cargar datos inicialmente y cuando cambie el filtro
  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const filteredLogs = (logs || []).filter((log) => {
    const matchSearch = !searchQuery || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user && log.user.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSearch;
  });

  const exportLogs = () => {
    const content = filteredLogs.map(log =>
      `[${log.timestamp}] [${log.level?.toUpperCase() || "INFO"}] [${log.module || "Unknown"}] ${log.message}${log.details ? ` - ${log.details}` : ""}`
    ).join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-omni-cyan"
        >
          <RefreshCw className="w-8 h-8" />
        </motion.div>
        <span className="ml-3 text-omni-text-secondary">Cargando logs del sistema...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-omni-text-primary mb-2">
            Error al cargar los logs
          </h3>
          <p className="text-omni-text-secondary mb-4">{error}</p>
          <button
            onClick={() => fetchLogs()}
            className="px-4 py-2 bg-omni-cyan text-omni-bg rounded-lg hover:bg-opacity-80 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-omni-text">System Logs</h1>
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="p-2 rounded-lg bg-omni-surface hover:bg-omni-surface-hover text-omni-cyan transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
        <p className="text-omni-textDim">Conectado al backend - Mostrando logs en tiempo real</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-omni-textDim" />
          <input
            type="text"
            placeholder="Buscar en logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="omni-input pl-10 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "info", "warning", "error", "success", "debug"] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={cn("px-3 py-1.5 rounded-lg border text-sm transition-all", {
                "bg-omni-cyan/20 border-omni-cyan text-omni-cyan": filter === level,
                "border-omni-border hover:border-omni-cyan/50": filter !== level,
              })}
            >
              {level.toUpperCase()}
              {level !== "all" && (
                <span className="ml-1 text-xs opacity-70">
                  ({(logs || []).filter(log => log.level === level).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <button 
          onClick={exportLogs} 
          className="omni-btn flex items-center gap-2"
          disabled={filteredLogs.length === 0}
        >
          <Download className="w-4 h-4" /> 
          Exportar
        </button>
      </div>

      <div className="flex-1 overflow-auto omni-card p-4 space-y-2">
        {filteredLogs.length === 0 && !loading && (
          <div className="text-center text-omni-textDim py-8">
            <Terminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No se encontraron logs con los filtros aplicados.</p>
          </div>
        )}
        
        <AnimatePresence>
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id || `${log.timestamp}-${index}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ delay: index * 0.02 }}
              className="bg-omni-surface border border-omni-border rounded-lg p-3 flex gap-3 items-start hover:border-omni-cyan/30 transition-colors"
            >
              <div className={cn("pt-1", getColorForLevel(log.level || "info"))}>
                {getIconForLevel(log.level || "info")}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-omni-textDim mb-1 flex-wrap">
                  <span className="font-mono bg-omni-surface2 px-2 py-0.5 rounded">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", {
                    "bg-omni-cyan/20 text-omni-cyan": log.level === "info",
                    "bg-omni-yellow/20 text-omni-yellow": log.level === "warning",
                    "bg-omni-red/20 text-omni-red": log.level === "error",
                    "bg-omni-green/20 text-omni-green": log.level === "success",
                    "bg-purple-500/20 text-purple-400": log.level === "debug",
                  })}>
                    {log.level?.toUpperCase() || "INFO"}
                  </span>
                  <span className="text-omni-cyan bg-omni-cyan/10 px-2 py-0.5 rounded">
                    {log.module}
                  </span>
                  {log.user && (
                    <span className="text-omni-textDim">
                      <Code2 className="w-3 h-3 inline mr-1" />
                      {log.user}
                    </span>
                  )}
                  {log.ip && (
                    <span className="text-omni-textDim font-mono text-xs">
                      {log.ip}
                    </span>
                  )}
                  {log.env && (
                    <span className={cn("text-xs px-1.5 py-0.5 rounded text-white", {
                      "bg-red-600": log.env === "production",
                      "bg-yellow-600": log.env === "staging", 
                      "bg-blue-600": log.env === "development"
                    })}>
                      {log.env.toUpperCase()}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-omni-text mb-1 break-words">
                  {log.message}
                </p>
                
                {log.details && (
                  <p className="text-xs text-omni-textDim mb-1 bg-omni-surface2 p-2 rounded">
                    <strong>Detalles:</strong> {log.details}
                  </p>
                )}
                
                {log.stack && (
                  <details className="text-xs mt-2">
                    <summary className="cursor-pointer text-omni-red hover:text-omni-red/80">
                      Stack Trace
                    </summary>
                    <pre className="text-xs bg-black/30 rounded p-2 mt-1 overflow-auto whitespace-pre-wrap font-mono">
                      {log.stack}
                    </pre>
                  </details>
                )}
              </div>
              
              <button
                onClick={() =>
                  handleCopy(`[${log.timestamp}] [${log.level?.toUpperCase() || "INFO"}] [${log.module}] ${log.message}`)
                }
                className="p-1 hover:bg-omni-surface2 hover:text-omni-cyan rounded transition-colors"
                title="Copiar log"
              >
                <Copy className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4 text-xs text-omni-textDim flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>Mostrando {filteredLogs.length} / {(logs || []).length} logs</span>
          {copied && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-omni-green flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Copiado al portapapeles
            </motion.span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 bg-omni-green rounded-full animate-pulse" />
          <span>En vivo</span>
        </div>
      </div>
    </div>
  );
};

export default LoggerPage;