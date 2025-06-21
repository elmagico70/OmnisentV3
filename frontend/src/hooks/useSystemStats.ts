// src/hooks/useSystemStats.ts
import { useEffect, useState } from "react"

export interface SystemStats {
  cpu: number // %
  ramUsed: number // GB
  ramTotal: number // GB
  uptime: number // minutos
  disk: number // %
  netSpeed: string // MB/s
}

export const useSystemStats = (): SystemStats => {
  const [stats, setStats] = useState<SystemStats>({
    cpu: 36,
    ramUsed: 7.2,
    ramTotal: 64,
    uptime: 1200,
    disk: 52,
    netSpeed: "4.3 MB/s",
  })

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulación de cambios aleatorios para demo
      setStats((prev) => ({
        ...prev,
        cpu: Math.min(100, Math.max(0, prev.cpu + (Math.random() - 0.5) * 10)),
        ramUsed: Math.min(prev.ramTotal, prev.ramUsed + (Math.random() - 0.5) * 0.5),
        uptime: prev.uptime + 1,
        disk: Math.min(100, Math.max(0, prev.disk + (Math.random() - 0.5) * 2)),
        netSpeed: `${(Math.random() * 8).toFixed(1)} MB/s`,
      }))
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return stats
}