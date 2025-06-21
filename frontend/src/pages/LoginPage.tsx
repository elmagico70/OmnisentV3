import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/modules/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/services/api";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle,
  Loader2,
  Zap,
  Shield,
  Cpu,
  Activity,
  ArrowRight,
  KeyRound,
  User,
  Globe,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface LoginResponse {
  status: "success" | "error";
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  message?: string;
}

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Visual effects state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStats] = useState({
    cpu: Math.floor(Math.random() * 30 + 20),
    users: Math.floor(Math.random() * 50 + 100),
    uptime: "99.9%"
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError("Por favor, completa todos los campos");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.auth.login({
        username: formData.username.trim(),
        password: formData.password
      });

      const data: LoginResponse = response.data;

      if (data.status === "success" && data.access_token && data.user) {
        setSuccess(true);
        
        // Usar el nuevo método login del AuthContext
        login(data.access_token, data.user);
        
        // Delay navigation for success animation
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setError(data.message || "Credenciales inválidas");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Credenciales incorrectas");
      } else if (err.response?.status === 500) {
        setError("Error del servidor. Intenta de nuevo más tarde.");
      } else if (err.code === 'ECONNABORTED') {
        setError("Tiempo de espera agotado. Verifica tu conexión.");
      } else if (!err.response) {
        setError("Error de conexión. Verifica que el servidor esté funcionando.");
      } else {
        setError(err.response?.data?.message || "Error desconocido");
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const successVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 200
      }
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-omni-bg via-zinc-900 to-black">
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
          }}
        />
        
        {/* Floating orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-omni-cyan/10 to-blue-500/5 rounded-full blur-3xl"
        />
        
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/5 to-pink-500/10 rounded-full blur-3xl"
        />
        
        {/* Scan lines */}
        <motion.div
          animate={{ y: ["-100vh", "100vh"] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute w-full h-px bg-gradient-to-r from-transparent via-omni-cyan/30 to-transparent"
        />
      </div>

      {/* Left side - Branding */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center relative z-10 p-12"
      >
        <motion.div variants={itemVariants} className="text-center max-w-md">
          {/* Logo */}
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.05, 1]
            }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-omni-cyan to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-omni-cyan/20"
          >
            <Zap className="w-12 h-12 text-white" />
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white to-omni-cyan bg-clip-text text-transparent"
          >
            OMNISENT
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-xl text-zinc-400 mb-8"
          >
            Advanced System Intelligence Platform
          </motion.p>
          
          {/* Features */}
          <motion.div variants={itemVariants} className="space-y-4">
            {[
              { icon: Shield, text: "Enterprise Security", color: "text-omni-green" },
              { icon: Activity, text: "Real-time Monitoring", color: "text-omni-cyan" },
              { icon: Cpu, text: "AI-Powered Analytics", color: "text-purple-400" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.2 }}
                className="flex items-center gap-3 text-zinc-300"
              >
                <feature.icon className={cn("w-5 h-5", feature.color)} />
                <span>{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* System stats */}
        <motion.div 
          variants={itemVariants}
          className="absolute bottom-12 left-12 right-12"
        >
          <div className="flex justify-between text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-omni-green rounded-full animate-pulse" />
              <span>CPU: {systemStats.cpu}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>{systemStats.users} users online</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Uptime: {systemStats.uptime}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Success overlay */}
          <AnimatePresence>
            {success && (
              <motion.div
                variants={successVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute inset-0 bg-omni-bg/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <CheckCircle className="w-16 h-16 text-omni-green mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-omni-text mb-2">¡Bienvenido!</h3>
                  <p className="text-omni-textDim">Redirigiendo al dashboard...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main form container */}
          <motion.div
            variants={itemVariants}
            className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Header glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-omni-cyan to-transparent" />
            
            {/* Time display */}
            <motion.div variants={itemVariants} className="text-center mb-8">
              <div className="text-sm text-zinc-500 mb-2">
                {currentTime.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="font-mono text-2xl text-omni-cyan">
                {currentTime.toLocaleTimeString()}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Iniciar Sesión</h2>
              <p className="text-zinc-400">Accede a tu panel de control</p>
            </motion.div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username field */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Usuario
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-omni-cyan transition-colors" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="admin"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-omni-cyan focus:ring-1 focus:ring-omni-cyan focus:outline-none transition-all duration-200"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-omni-cyan/0 via-omni-cyan/0 to-omni-cyan/0 group-focus-within:from-omni-cyan/10 group-focus-within:via-omni-cyan/5 group-focus-within:to-omni-cyan/10 transition-all duration-200 pointer-events-none" />
                </div>
              </motion.div>

              {/* Password field */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Contraseña
                </label>
                <div className="relative group">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-omni-cyan transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="1234"
                    className="w-full pl-10 pr-12 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-omni-cyan focus:ring-1 focus:ring-omni-cyan focus:outline-none transition-all duration-200"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-omni-cyan transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-omni-cyan/0 via-omni-cyan/0 to-omni-cyan/0 group-focus-within:from-omni-cyan/10 group-focus-within:via-omni-cyan/5 group-focus-within:to-omni-cyan/10 transition-all duration-200 pointer-events-none" />
                </div>
              </motion.div>

              {/* Submit button */}
              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className={cn(
                    "w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 relative overflow-hidden group",
                    isLoading
                      ? "bg-zinc-700 cursor-not-allowed"
                      : "bg-gradient-to-r from-omni-cyan to-blue-600 hover:from-omni-cyan/90 hover:to-blue-600/90 shadow-lg shadow-omni-cyan/25 hover:shadow-omni-cyan/40"
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        Acceder
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  
                  {!isLoading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  )}
                </motion.button>
              </motion.div>
            </form>

            {/* Demo credentials hint */}
            <motion.div 
              variants={itemVariants}
              className="mt-6 p-3 bg-omni-cyan/5 border border-omni-cyan/20 rounded-lg"
            >
              <p className="text-xs text-omni-cyan text-center">
                <Lock className="w-3 h-3 inline mr-1" />
                Demo: admin / 1234
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;