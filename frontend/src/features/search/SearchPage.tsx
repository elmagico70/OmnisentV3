import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Database,
  Globe,
  FileText,
  Mail,
  Key,
  User,
  CreditCard,
  Phone,
  AlertCircle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface SearchFilter {
  id: string;
  label: string;
  icon: React.ElementType;
  count?: number;
  color: string;
}

interface SearchResult {
  id: string;
  type: string;
  content: string;
  source: string;
  date: string;
  risk: "low" | "medium" | "high";
}

interface SearchStats {
  totalRecords: number;
  uniqueEmails: number;
  passwords: number;
  newToday: number;
}

const filters: SearchFilter[] = [
  { id: "all", label: "All", icon: Database, color: "text-omni-cyan" },
  { id: "email", label: "Emails", icon: Mail, color: "text-blue-400" },
  { id: "password", label: "Passwords", icon: Key, color: "text-omni-red" },
  { id: "username", label: "Usernames", icon: User, color: "text-omni-green" },
  { id: "card", label: "Credit Cards", icon: CreditCard, color: "text-omni-yellow" },
  { id: "phone", label: "Phone Numbers", icon: Phone, color: "text-purple-400" },
  { id: "url", label: "URLs", icon: Globe, color: "text-orange-400" },
  { id: "file", label: "Files", icon: FileText, color: "text-pink-400" },
];

export const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performSearch = async (query: string, type: string = "all") => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);

      const params = new URLSearchParams({
        q: query.trim(),
        ...(type !== "all" && { type })
      });

      const response = await fetch(`http://localhost:8000/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data.results || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la búsqueda');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery, activeFilter);
  };

  // Búsqueda automática cuando cambia el filtro
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery, activeFilter);
    }
  }, [activeFilter]);

  // Actualizar contadores de filtros basándose en los resultados
  const getFilterWithCounts = () => {
    return filters.map(filter => {
      if (filter.id === "all") {
        return { ...filter, count: results.length };
      }
      const count = results.filter(result => result.type === filter.id).length;
      return { ...filter, count };
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-omni-red bg-omni-red/20 border-omni-red/20";
      case "medium": return "text-omni-yellow bg-omni-yellow/20 border-omni-yellow/20";
      case "low": return "text-omni-green bg-omni-green/20 border-omni-green/20";
      default: return "text-omni-textDim bg-omni-surface2 border-omni-border";
    }
  };

  const getTypeColor = (type: string) => {
    const filter = filters.find(f => f.id === type);
    return filter?.color || "text-omni-textDim";
  };

  return (
    <div className="h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-omni-text mb-2">
          Advanced Search Engine
        </h1>
        <p className="text-omni-textDim">
          Search through millions of records with fuzzy matching and filters
        </p>
      </div>

      {/* Input de búsqueda */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-omni-textDim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for emails, passwords, usernames, IPs, domains..."
            className="omni-input pl-12 pr-32 py-3 text-lg"
            autoFocus
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded hover:bg-omni-surface2 transition-colors"
            >
              <Filter className="w-4 h-4 text-omni-textDim" />
            </button>
            <button
              type="submit"
              className="omni-btn-primary px-4 py-1.5 text-sm"
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Searching...
                </div>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-omni-red/10 border border-omni-red/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-omni-red" />
          <span className="text-omni-red">{error}</span>
          <button
            onClick={() => performSearch(searchQuery, activeFilter)}
            className="ml-auto text-omni-red hover:text-omni-red/80"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {getFilterWithCounts().map((filter) => (
          <motion.button
            key={filter.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200",
              activeFilter === filter.id
                ? "bg-omni-cyan/20 border-omni-cyan text-omni-cyan"
                : "border-omni-border hover:border-omni-cyan/50 text-omni-textDim hover:text-omni-text"
            )}
          >
            <filter.icon className={cn("w-4 h-4", filter.color)} />
            <span className="text-sm font-medium">{filter.label}</span>
            {filter.count !== undefined && filter.count > 0 && (
              <span className="text-xs opacity-70 bg-omni-surface2 px-1.5 py-0.5 rounded-full">
                {filter.count}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Resultados */}
      <div className="space-y-3 mb-6">
        {searchQuery && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-omni-textDim mb-4"
          >
            Encontrados {results.length} resultados para "{searchQuery}"
          </motion.div>
        )}

        {results.map((result, index) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="omni-card hover:border-omni-cyan/50 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs rounded-full font-medium",
                      getTypeColor(result.type),
                      "bg-current bg-opacity-20"
                    )}
                  >
                    {result.type}
                  </span>
                  <span className="text-xs text-omni-textDim">
                    {result.source}
                  </span>
                  <span className="text-xs text-omni-textDim">
                    {new Date(result.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-mono text-omni-text mb-2 break-all">
                  {result.content}
                </p>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border",
                  getRiskColor(result.risk)
                )}
              >
                <AlertCircle className="w-3 h-3" />
                {result.risk} risk
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Estado vacío */}
      {!searchQuery && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Search className="w-16 h-16 text-omni-textDim mb-4 animate-pulse" />
          <h3 className="text-lg font-medium text-omni-text mb-2">
            Start searching
          </h3>
          <p className="text-omni-textDim max-w-md">
            Enter any email, password, username, IP address, or domain to search
            through our extensive database.
          </p>
        </div>
      )}

      {/* No results */}
      {searchQuery && results.length === 0 && !isSearching && !error && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Database className="w-16 h-16 text-omni-textDim mb-4" />
          <h3 className="text-lg font-medium text-omni-text mb-2">
            No results found
          </h3>
          <p className="text-omni-textDim max-w-md">
            No records were found matching "{searchQuery}". Try adjusting your search terms or filters.
          </p>
        </div>
      )}

      {/* Loading state */}
      {isSearching && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <RefreshCw className="w-16 h-16 text-omni-cyan mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-omni-text mb-2">
            Searching...
          </h3>
          <p className="text-omni-textDim">
            Scanning through millions of records...
          </p>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-4 bg-omni-surface rounded-lg border border-omni-border"
        >
          <h3 className="text-sm font-medium text-omni-text mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-omni-cyan" />
            Database Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-omni-cyan">
                {stats.totalRecords.toLocaleString()}
              </p>
              <p className="text-xs text-omni-textDim">Total Records</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-omni-green">
                {stats.uniqueEmails.toLocaleString()}
              </p>
              <p className="text-xs text-omni-textDim">Unique Emails</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-omni-yellow">
                {stats.passwords.toLocaleString()}
              </p>
              <p className="text-xs text-omni-textDim">Passwords</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-omni-purple">
                {stats.newToday.toLocaleString()}
              </p>
              <p className="text-xs text-omni-textDim">New Today</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};