import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Activity,
  Settings,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Terminal,
  Code2,
  Clock,
  Calendar,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { apiClient } from '@/services/api';
import { useMultipleApi } from '@/hooks/useApi';

// Tipos
interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success' | 'debug';
  message: string;
  module: string;
  user?: string;
  ip?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'banned';
  lastLogin: string;
  loginCount: number;
  ipAddress: string;
}

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  change: number;
  status: 'good' | 'warning' | 'critical';
}

interface SecurityStatus {
  firewall: string;
  ssl: string;
  twoFA: string;
  lastScan: string;
}

interface ThreatAlert {
  id: string;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
  ip?: string;
}

// Componentes
const LogEntry: React.FC<{ log: SystemLog }> = ({ log }) => {
  const getIcon = () => {
    switch (log.level) {
      case 'info': return Info;
      case 'warning': return AlertTriangle;
      case 'error': return XCircle;
      case 'success': return CheckCircle;
      case 'debug': return Code2;
    }
  };

  const getColor = () => {
    switch (log.level) {
      case 'info': return 'text-omni-cyan';
      case 'warning': return 'text-omni-yellow';
      case 'error': return 'text-omni-red';
      case 'success': return 'text-omni-green';
      case 'debug': return 'text-purple-400';
    }
  };

  const Icon = getIcon();

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-omni-surface2 transition-colors rounded-lg">
      <Icon className={cn("w-4 h-4 mt-0.5", getColor())} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-omni-textDim">
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-omni-surface2 text-omni-cyan">
            {log.module}
          </span>
          {log.user && (
            <span className="text-xs text-omni-textDim">by {log.user}</span>
          )}
        </div>
        <p className="text-sm text-omni-text">{log.message}</p>
        {log.ip && (
          <span className="text-xs text-omni-textDim">IP: {log.ip}</span>
        )}
      </div>
    </div>
  );
};

const UserRow: React.FC<{ user: User; onAction: (action: string, user: User) => void }> = ({ user, onAction }) => {
  const getRoleColor = () => {
    switch (user.role) {
      case 'admin': return 'text-omni-red bg-omni-red/20';
      case 'user': return 'text-omni-cyan bg-omni-cyan/20';
      case 'guest': return 'text-omni-textDim bg-omni-surface2';
    }
  };

  const getStatusColor = () => {
    switch (user.status) {
      case 'active': return 'text-omni-green';
      case 'inactive': return 'text-omni-yellow';
      case 'banned': return 'text-omni-red';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="grid grid-cols-7 gap-4 p-3 hover:bg-omni-surface2 transition-colors rounded-lg items-center"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-omni-surface2 flex items-center justify-center">
          <Users className="w-4 h-4 text-omni-cyan" />
        </div>
        <span className="text-sm font-medium text-omni-text">{user.username}</span>
      </div>
      <span className="text-sm text-omni-textDim">{user.email}</span>
      <span className={cn("text-xs px-2 py-1 rounded-full w-fit", getRoleColor())}>
        {user.role}
      </span>
      <div className="flex items-center gap-1">
        <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
        <span className="text-sm text-omni-textDim">{user.status}</span>
      </div>
      <span className="text-xs text-omni-textDim">
        {new Date(user.lastLogin).toLocaleDateString()}
      </span>
      <span className="text-sm text-omni-textDim">{user.loginCount}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onAction('view', user)}
          className="p-1 rounded hover:bg-omni-surface hover:text-omni-cyan transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => onAction('toggle', user)}
          className="p-1 rounded hover:bg-omni-surface hover:text-omni-yellow transition-colors"
        >
          {user.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
        <button
          onClick={() => onAction('delete', user)}
          className="p-1 rounded hover:bg-omni-surface hover:text-omni-red transition-colors"
        >
          <UserX className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const MetricCard: React.FC<{ metric: SystemMetric }> = ({ metric }) => {
  const getStatusColor = () => {
    switch (metric.status) {
      case 'good': return 'text-omni-green';
      case 'warning': return 'text-omni-yellow';
      case 'critical': return 'text-omni-red';
    }
  };

  return (
    <div className="omni-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-omni-textDim">{metric.name}</span>
        <span className={cn("text-xs flex items-center gap-1", getStatusColor())}>
          {metric.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(metric.change).toFixed(1)}%
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-omni-text">{metric.value.toFixed(1)}</span>
        <span className="text-sm text-omni-textDim">{metric.unit}</span>
      </div>
      <div className="mt-2 h-1 bg-omni-surface2 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", {
            'bg-omni-green': metric.status === 'good',
            'bg-omni-yellow': metric.status === 'warning',
            'bg-omni-red': metric.status === 'critical',
          })}
          style={{ width: `${Math.min((metric.value / 100) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'users' | 'security'>('overview');
  const [logFilter, setLogFilter] = useState<'all' | SystemLog['level']>('all');

  // Usar useMultipleApi para cargar todos los datos necesarios
  const { 
    data, 
    loading, 
    errors, 
    execute: fetchData,
    hasErrors 
  } = useMultipleApi({
    users: () => apiClient.admin.getUsers(),
    metrics: () => apiClient.admin.getMetrics(),
    security: () => apiClient.admin.getSecurity(),
    logs: () => apiClient.logs.getLogs({ limit: 50 })
  }, {
    onError: (error) => {
      console.error('Error fetching admin data:', error);
    }
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, []);

  // Extraer datos del resultado
  const users = data.users || [];
  const metrics = data.metrics || [];
  const logs = data.logs || [];
  const securityData = data.security || {};
  const securityStatus = securityData.status || null;
  const threats = securityData.threats || [];

  const handleUserAction = async (action: string, user: User) => {
    try {
      if (action === 'toggle') {
        await apiClient.admin.toggleUserStatus(user.id);
        fetchData(); // Refrescar datos
      } else if (action === 'delete') {
        await apiClient.admin.deleteUser(user.id);
        fetchData(); // Refrescar datos
      }
    } catch (err) {
      console.error(`Error performing ${action} on user:`, err);
    }
  };

  const filteredLogs = logFilter === 'all' ? logs : logs.filter(log => log.level === logFilter);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalLogs: logs.length,
    errorLogs: logs.filter(l => l.level === 'error').length,
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
        <span className="ml-3 text-omni-text-secondary">Cargando panel de administración...</span>
      </div>
    );
  }

  if (hasErrors) {
    const errorMessage = Object.values(errors)[0] || 'Error desconocido';
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-omni-text-primary mb-2">
            Error al cargar los datos
          </h3>
          <p className="text-omni-text-secondary mb-4">{errorMessage}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-omni-cyan text-omni-bg rounded-lg hover:bg-opacity-80 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-omni-text mb-2">Admin Panel</h1>
          <p className="text-omni-textDim">System administration and monitoring</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="omni-btn flex items-center gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-omni-border">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'logs', label: 'System Logs', icon: Terminal },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'security', label: 'Security', icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border-b-2 transition-all",
              activeTab === tab.id
                ? "border-omni-cyan text-omni-cyan"
                : "border-transparent text-omni-textDim hover:text-omni-text"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="omni-card">
                <div className="flex items-center justify-between">
                  <Users className="w-8 h-8 text-omni-cyan" />
                  <span className="text-xs text-omni-green">+12%</span>
                </div>
                <p className="text-2xl font-bold text-omni-text mt-2">{stats.totalUsers}</p>
                <p className="text-sm text-omni-textDim">Total Users</p>
              </div>
              <div className="omni-card">
                <div className="flex items-center justify-between">
                  <Activity className="w-8 h-8 text-omni-green" />
                  <span className="text-xs text-omni-green">Active</span>
                </div>
                <p className="text-2xl font-bold text-omni-text mt-2">{stats.activeUsers}</p>
                <p className="text-sm text-omni-textDim">Online Now</p>
              </div>
              <div className="omni-card">
                <div className="flex items-center justify-between">
                  <Terminal className="w-8 h-8 text-omni-yellow" />
                  <span className="text-xs text-omni-yellow">Monitoring</span>
                </div>
                <p className="text-2xl font-bold text-omni-text mt-2">{stats.totalLogs}</p>
                <p className="text-sm text-omni-textDim">Log Entries</p>
              </div>
              <div className="omni-card">
                <div className="flex items-center justify-between">
                  <AlertTriangle className="w-8 h-8 text-omni-red" />
                  <span className="text-xs text-omni-red">Alert</span>
                </div>
                <p className="text-2xl font-bold text-omni-text mt-2">{stats.errorLogs}</p>
                <p className="text-sm text-omni-textDim">Errors</p>
              </div>
            </div>

            {/* System Metrics */}
            <div>
              <h2 className="text-lg font-semibold text-omni-text mb-4">System Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {metrics.map((metric) => (
                  <MetricCard key={metric.name} metric={metric} />
                ))}
              </div>
            </div>

            {/* Live Activity */}
            <div className="omni-card">
              <h2 className="text-lg font-semibold text-omni-text mb-4">Recent Activity</h2>
              <div className="space-y-2 max-h-64 overflow-auto">
                {logs.slice(0, 5).map((log) => (
                  <LogEntry key={log.id} log={log} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Log Filters */}
            <div className="flex items-center gap-2">
              {(['all', 'info', 'warning', 'error', 'success', 'debug'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setLogFilter(level)}
                  className={cn(
                    "px-3 py-1 rounded-lg border transition-all text-sm",
                    logFilter === level
                      ? "bg-omni-cyan/20 border-omni-cyan text-omni-cyan"
                      : "border-omni-border hover:border-omni-cyan/50"
                  )}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
              <div className="flex-1" />
              <button className="omni-btn flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Logs
              </button>
            </div>

            {/* Log List */}
            <div className="omni-card p-4 space-y-1 max-h-[600px] overflow-auto">
              {filteredLogs.map((log) => (
                <LogEntry key={log.id} log={log} />
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* User Management Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-omni-text">User Management</h2>
              <button className="omni-btn flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Add User
              </button>
            </div>

            {/* User List */}
            <div className="omni-card p-4">
              {/* Header */}
              <div className="grid grid-cols-7 gap-4 p-3 text-xs text-omni-textDim border-b border-omni-border">
                <span>Username</span>
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
                <span>Last Login</span>
                <span>Logins</span>
                <span>Actions</span>
              </div>
              
              {/* Users */}
              <div className="space-y-1 mt-2">
                {users.map((user) => (
                  <UserRow key={user.id} user={user} onAction={handleUserAction} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Security Status */}
              <div className="omni-card">
                <h2 className="text-lg font-semibold text-omni-text mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-omni-green" />
                  Security Status
                </h2>
                {securityStatus && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-omni-textDim">Firewall</span>
                      <span className="text-sm text-omni-green flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> {securityStatus.firewall}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-omni-textDim">SSL Certificate</span>
                      <span className="text-sm text-omni-green flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> {securityStatus.ssl}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-omni-textDim">2FA Enforcement</span>
                      <span className="text-sm text-omni-yellow flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> {securityStatus.twoFA}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-omni-textDim">Last Security Scan</span>
                      <span className="text-sm text-omni-textDim">{securityStatus.lastScan}</span>
                    </div>
                  </div>
                )}
                <button className="omni-btn w-full mt-4">Run Security Scan</button>
              </div>

              {/* Threat Detection */}
              <div className="omni-card">
                <h2 className="text-lg font-semibold text-omni-text mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-omni-yellow" />
                  Threat Detection
                </h2>
                <div className="space-y-3">
                  {threats.map((threat) => (
                    <div 
                      key={threat.id}
                      className={cn("p-3 border rounded-lg", {
                        'bg-omni-red/10 border-omni-red/20': threat.severity === 'high',
                        'bg-omni-yellow/10 border-omni-yellow/20': threat.severity === 'medium',
                        'bg-omni-green/10 border-omni-green/20': threat.severity === 'low'
                      })}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("text-sm font-medium", {
                          'text-omni-red': threat.severity === 'high',
                          'text-omni-yellow': threat.severity === 'medium',
                          'text-omni-green': threat.severity === 'low'
                        })}>
                          {threat.type}
                        </span>
                        <span className="text-xs text-omni-textDim">
                          {new Date(threat.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-omni-textDim">{threat.message}</p>
                      {threat.ip && (
                        <p className="text-xs text-omni-textDim">IP: {threat.ip}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Access Control */}
            <div className="omni-card">
              <h2 className="text-lg font-semibold text-omni-text mb-4">Access Control Rules</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-omni-surface2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-omni-cyan" />
                    <div>
                      <p className="text-sm font-medium text-omni-text">Admin Panel</p>
                      <p className="text-xs text-omni-textDim">Requires admin role</p>
                    </div>
                  </div>
                  <button className="text-xs text-omni-cyan hover:text-omni-cyan/80">Edit</button>
                </div>
                <div className="flex items-center justify-between p-3 bg-omni-surface2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-omni-cyan" />
                    <div>
                      <p className="text-sm font-medium text-omni-text">API Access</p>
                      <p className="text-xs text-omni-textDim">Rate limited to 1000 req/hour</p>
                    </div>
                  </div>
                  <button className="text-xs text-omni-cyan hover:text-omni-cyan/80">Edit</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;