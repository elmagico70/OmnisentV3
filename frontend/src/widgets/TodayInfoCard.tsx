// src/components/ui/TodayInfoCard.tsx
import React, { useEffect, useState } from "react"
import { CalendarDays, Clock } from "lucide-react"
import { Card } from "./Card"

const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export const TodayInfoCard = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const dayName = days[time.getDay()]
  const date = time.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  const hour = time.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return (
    <Card className="p-4 bg-zinc-900 border border-zinc-800 text-sm text-zinc-100">
      <h2 className="text-base font-semibold text-cyan-400 mb-2">📅 Hoy</h2>
      <div className="flex items-center gap-2">
        <CalendarDays size={16} className="text-green-400" />
        <span>{dayName}, {date}</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Clock size={16} className="text-blue-400" />
        <span>{hour}</span>
      </div>
    </Card>
  )
}