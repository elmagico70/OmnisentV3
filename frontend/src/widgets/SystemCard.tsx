// src/components/ui/SystemCard.tsx
import React from "react"
import { Card } from "./Card"
import { useSystemStats } from "@/hooks/useSystemStats"
import { Cpu, HardDrive, Clock3 } from "lucide-react"

export const SystemCard = () => {
  const { cpu, ramUsed, ramTotal, uptime } = useSystemStats()

  const formatUptime = (min: number) => {
    const hours = Math.floor(min / 60)
    const minutes = min % 60
    return `${hours}h ${minutes}m`
  }

  return (
    <Card className="p-4 space-y-2 bg-zinc-900 border border-zinc-800 text-sm text-zinc-100">
      <h2 className="text-base font-semibold text-cyan-400 mb-2">🧠 Stats del sistema</h2>

      <div className="flex items-center gap-2">
        <Cpu size={18} className="text-cyan-500" />
        <span className="w-24">CPU:</span>
        <strong>{cpu.toFixed(1)}%</strong>
      </div>

      <div className="flex items-center gap-2">
        <HardDrive size={18} className="text-green-500" />
        <span className="w-24">RAM:</span>
        <strong>{ramUsed.toFixed(1)} / {ramTotal} GB</strong>
      </div>

      <div className="flex items-center gap-2">
        <Clock3 size={18} className="text-yellow-400" />
        <span className="w-24">Uptime:</span>
        <strong>{formatUptime(uptime)}</strong>
      </div>
    </Card>
  )
}