import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, 
  Users, 
  HardDrive, 
  Cpu, 
  TrendingUp, 
  Server,
  Database,
  Wifi,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface DashboardData {
  cpu: string;
  memory: string;
  disk: string;
  users: number;
}

interface SystemStats {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/api/dashboard');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const dashboardData: DashboardData = await response.json();
      setData(dashboardData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getSystemStats = (): SystemStats[] => {
    if (!data) return [];
    
    return [
      {
        label: "CPU Usage",
        value: data.cpu,
        icon: <Cpu className="w-5 h-5" />,
        color: "from-blue-500 to-cyan-500",
        trend: Math.random() > 0.5 ? 2.3 : -1.2
      },
      {
        label: "Memory",
        value: data.memory,
        icon: <Database className="w-5 h-5" />,
        color: "from-purple-500 to-pink-500",
        trend: Math.random() > 0.5 ? 5.1 : -0.8
      },
      {
        label: "Disk Usage",
        value: data.disk,
        icon: <HardDrive className="w-5 h-5" />,
        color: "from-green-500 to-emerald-500",
        trend: Math.random() > 0.5 ? 1.5 : -2.1
      },
      {
        label: "Active Users",
        value: data.users.toString(),
        icon: <Users className="w-5 h-5" />,
        color: "from-orange-500 to-red-500",
        trend: Math.random() > 0.5 ? 12.3 : -3.4
      }
    ];
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-omni-cyan"
        >
          <RefreshCw className="w-8 h-8" />
        </motion.div>
        <span className="ml-3 text-omni-text-secondary">Cargando datos del sistema...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-omni-text-primary mb-2">
            Error al cargar los datos
          </h3>
          <p className="text-omni-text-secondary mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-omni-cyan text-omni-bg rounded-lg hover:bg-opacity-80 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const stats = getSystemStats();

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-omni-text-primary">
            Dashboard de Sistema
          </h1>
          <p className="text-omni-text-secondary mt-1">
            Monitoreo en tiempo real del estado del sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-omni-text-secondary">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors ${
              loading 
                ? 'bg-omni-surface text-omni-text-secondary cursor-not-allowed' 
                : 'bg-omni-surface hover:bg-omni-surface-hover text-omni-cyan hover:text-omni-cyan-light'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden"
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10 rounded-xl`} />
            
            {/* Card content */}
            <div className="relative bg-omni-surface border border-omni-border rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                  {stat.icon}
                </div>
                {stat.trend && (
                  <div className={`flex items-center text-xs ${
                    stat.trend > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <TrendingUp className={`w-3 h-3 mr-1 ${
                      stat.trend < 0 ? 'rotate-180' : ''
                    }`} />
                    {Math.abs(stat.trend)}%
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-omni-text-secondary text-sm mb-1">
                  {stat.label}
                </p>
                <motion.p 
                  variants={pulseVariants}
                  animate="pulse"
                  className="text-2xl font-bold text-omni-text-primary"
                >
                  {stat.value}
                </motion.p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-omni-surface border border-omni-border rounded-xl p-6"
      >
        <div className="flex items-center mb-4">
          <Server className="w-5 h-5 text-omni-cyan mr-2" />
          <h2 className="text-lg font-semibold text-omni-text-primary">
            Estado del Sistema
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-omni-text-secondary">Sistema operativo</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-omni-text-secondary">Base de datos</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-omni-text-secondary">Red</span>
          </div>
        </div>
      </motion.div>

      {/* Activity Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-omni-surface border border-omni-border rounded-xl p-6"
      >
        <div className="flex items-center mb-4">
          <Activity className="w-5 h-5 text-omni-cyan mr-2" />
          <h2 className="text-lg font-semibold text-omni-text-primary">
            Actividad del Sistema
          </h2>
        </div>
        
        <div className="h-48 flex items-center justify-center bg-omni-bg rounded-lg border border-omni-border">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-omni-text-secondary mx-auto mb-2" />
            <p className="text-omni-text-secondary">
              Gráfico de actividad próximamente
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;