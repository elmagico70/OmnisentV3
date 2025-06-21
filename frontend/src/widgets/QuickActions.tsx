// src/components/ui/QuickActions.tsx
import React from "react"
import { useNavigate } from "react-router-dom"
import { useTheme } from "@/hooks/useTheme"
import { Search, Bot, Plus, Settings, Moon, Sun } from "lucide-react"
import { Card } from "./Card"

export const QuickActions = () => {
  const navigate = useNavigate()
  const { mode, toggleTheme } = useTheme()

  const actions = [
    {
      icon: <Search size={16} />,
      label: "Buscar",
      onClick: () => navigate("/search"),
    },
    {
      icon: <Bot size={16} />,
      label: "IA Asistente",
      onClick: () => navigate("/ai"),
    },
    {
      icon: <Plus size={16} />,
      label: "Nueva Nota",
      onClick: () => navigate("/notes"),
    },
    {
      icon: mode === "dark" ? <Sun size={16} /> : <Moon size={16} />,
      label: mode === "dark" ? "Tema claro" : "Tema oscuro",
      onClick: () => toggleTheme(),
    },
    {
      icon: <Settings size={16} />,
      label: "Configuración",
      onClick: () => navigate("/settings"),
    },
  ]

  return (
    <Card className="p-4 bg-zinc-900 border border-zinc-800 text-sm text-zinc-100">
      <h2 className="text-base font-semibold text-cyan-400 mb-3">⚡ Acciones Rápidas</h2>
      <div className="grid gap-2">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className="omni-btn justify-start flex items-center gap-2 w-full"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </Card>
  )
}