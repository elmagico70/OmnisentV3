import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Moon,
  Sun,
  Bell,
  Shield,
  Database,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Key,
  Monitor,
} from "lucide-react";

interface AppSettings {
  theme: string;
  notifications: boolean;
  shortcuts: {
    [key: string]: string;
  };
  system?: {
    autoBackup: boolean;
    logLevel: string;
    maxLogSize: string;
  };
}

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
}

const sections: SettingsSection[] = [
  {
    id: "appearance",
    title: "Appearance",
    icon: Monitor,
    description: "Theme, display and visual preferences"
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: Bell,
    description: "Alert preferences and notification settings"
  },
  {
    id: "security",
    title: "Security",
    icon: Shield,
    description: "Authentication and security settings"
  },
  {
    id: "system",
    title: "System",
    icon: Database,
    description: "System configuration and maintenance"
  },
  {
    id: "shortcuts",
    title: "Shortcuts",
    icon: Key,
    description: "Keyboard shortcuts and hotkeys"
  }
];

export const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState("appearance");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Función para cargar settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching settings from backend...');
      
      const response = await fetch("http://localhost:8000/api/settings", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors'
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Settings data received:', data);
      
      // Estructura los datos para que coincidan con nuestra interfaz
      const formattedSettings: AppSettings = {
        theme: data.theme || "dark",
        notifications: data.notifications !== undefined ? data.notifications : true,
        shortcuts: data.shortcuts || {
          "toggle-theme": "Ctrl+T",
          "open-search": "Ctrl+K"
        },
        system: {
          autoBackup: data.system?.autoBackup || false,
          logLevel: data.system?.logLevel || "info",
          maxLogSize: data.system?.maxLogSize || "10MB"
        }
      };
      
      setSettings(formattedSettings);
      console.log('✅ Settings formatted and set:', formattedSettings);
    } catch (err) {
      console.error('❌ Error fetching settings:', err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Cargar settings al montar el componente
  React.useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      setSaving(true);
      setSaveStatus('idle');
      
      // Simulamos el guardado (puedes implementar el endpoint PUT más tarde)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (path: string[], value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    setSettings(newSettings);
  };

  const toggleTheme = () => {
    const newTheme = settings?.theme === 'dark' ? 'light' : 'dark';
    handleSettingChange(['theme'], newTheme);
  };

  const clearLogs = async () => {
    console.log('Clearing logs...');
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
        <span className="ml-3 text-gray-400">Cargando configuración...</span>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            Error al cargar configuración
          </h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchSettings}
            className="px-4 py-2 bg-omni-cyan text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-700 pr-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Settings className="w-6 h-6 text-omni-cyan" />
            Settings
          </h1>
          <p className="text-gray-400 text-sm">
            Configure your application preferences
          </p>
        </div>

        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 ${
                activeSection === section.id
                  ? "bg-omni-cyan/20 text-omni-cyan border border-omni-cyan/30"
                  : "hover:bg-zinc-800 text-gray-400 hover:text-white"
              }`}
            >
              <section.icon className="w-5 h-5" />
              <div>
                <div className="font-medium text-sm">{section.title}</div>
                <div className="text-xs opacity-70">{section.description}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 pl-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {sections.find(s => s.id === activeSection)?.title}
            </h2>
            <p className="text-gray-400 text-sm">
              {sections.find(s => s.id === activeSection)?.description}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {saveStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 text-green-500 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Saved
              </motion.div>
            )}
            
            <button
              onClick={() => saveSettings(settings!)}
              disabled={saving || !settings}
              className="flex items-center gap-2 px-4 py-2 bg-omni-cyan text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {activeSection === "appearance" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Theme */}
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-white">Theme</h3>
                    <p className="text-sm text-gray-400">
                      Choose your preferred color scheme
                    </p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg border transition-all ${
                      settings.theme === 'dark'
                        ? "bg-zinc-700 border-zinc-600 text-white"
                        : "bg-yellow-100 border-yellow-300 text-yellow-800"
                    }`}
                  >
                    {settings.theme === 'dark' ? (
                      <Moon className="w-5 h-5" />
                    ) : (
                      <Sun className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSettingChange(['theme'], 'light')}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      settings.theme === 'light'
                        ? "border-omni-cyan bg-omni-cyan/10"
                        : "border-zinc-600 hover:border-omni-cyan/50"
                    }`}
                  >
                    <Sun className="w-5 h-5 mb-2 text-yellow-500" />
                    <div className="font-medium text-white">Light</div>
                    <div className="text-xs text-gray-400">Bright interface</div>
                  </button>
                  
                  <button
                    onClick={() => handleSettingChange(['theme'], 'dark')}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      settings.theme === 'dark'
                        ? "border-omni-cyan bg-omni-cyan/10"
                        : "border-zinc-600 hover:border-omni-cyan/50"
                    }`}
                  >
                    <Moon className="w-5 h-5 mb-2 text-omni-cyan" />
                    <div className="font-medium text-white">Dark</div>
                    <div className="text-xs text-gray-400">Easy on the eyes</div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === "notifications" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Push Notifications</h3>
                    <p className="text-sm text-gray-400">
                      Receive notifications for important events
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => handleSettingChange(['notifications'], e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-omni-cyan"></div>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === "shortcuts" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
                <h3 className="font-medium text-white mb-4">Keyboard Shortcuts</h3>
                <div className="space-y-3">
                  {Object.entries(settings.shortcuts).map(([action, shortcut]) => (
                    <div key={action} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white capitalize">
                          {action.replace('-', ' ')}
                        </div>
                      </div>
                      <div className="font-mono text-sm bg-zinc-700 text-white px-2 py-1 rounded border">
                        {shortcut}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === "system" && settings.system && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
                <h3 className="font-medium text-white mb-4">System Configuration</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">Auto Backup</div>
                      <div className="text-sm text-gray-400">Automatically backup system data</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.system.autoBackup}
                        onChange={(e) => handleSettingChange(['system', 'autoBackup'], e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-omni-cyan"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">Log Level</div>
                      <div className="text-sm text-gray-400">Set system logging verbosity</div>
                    </div>
                    <select 
                      value={settings.system.logLevel}
                      onChange={(e) => handleSettingChange(['system', 'logLevel'], e.target.value)}
                      className="bg-zinc-700 border border-zinc-600 text-white rounded px-3 py-1 w-32"
                    >
                      <option value="error">Error</option>
                      <option value="warning">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">Clear System Logs</div>
                      <div className="text-sm text-gray-400">Remove all stored log entries</div>
                    </div>
                    <button
                      onClick={clearLogs}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Logs
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === "security" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
                <h3 className="font-medium text-white mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">Two-Factor Authentication</div>
                      <div className="text-sm text-gray-400">Add extra security to your account</div>
                    </div>
                    <button className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg transition-colors">
                      Configure
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">Session Timeout</div>
                      <div className="text-sm text-gray-400">Automatically log out after inactivity</div>
                    </div>
                    <select className="bg-zinc-700 border border-zinc-600 text-white rounded px-3 py-1 w-32">
                      <option>15 min</option>
                      <option>30 min</option>
                      <option>1 hour</option>
                      <option>Never</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Configuration JSON */}
        <div className="mt-8">
          <details className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
            <summary className="cursor-pointer font-medium text-white mb-4">
              Current Configuration (JSON)
            </summary>
            <pre className="bg-zinc-900 p-4 rounded text-xs overflow-x-auto font-mono text-gray-300 mt-4">
              {JSON.stringify(settings, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};