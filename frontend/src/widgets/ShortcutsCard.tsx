// src/components/ui/ShortcutsCard.tsx
import React from "react"
import { Keyboard } from "lucide-react"
import { Card } from "./Card"
import { SHORTCUTS } from "@/config/appConfig"

const formatCombo = (combo: string) =>
  combo.replace("ctrl", "Ctrl").replace("shift", "Shift").replace("alt", "Alt").toUpperCase()

export const ShortcutsCard = () => {
  return (
    <Card className="p-4 bg-zinc-900 border border-zinc-800 text-sm text-zinc-100">
      <h2 className="text-base font-semibold text-cyan-400 mb-3 flex items-center gap-2">
        <Keyboard size={16} />
        Atajos de Teclado
      </h2>
      <ul className="space-y-2">
        <li><b>{formatCombo(SHORTCUTS.toggleTheme)}</b> — Cambiar tema</li>
        <li><b>{formatCombo(SHORTCUTS.openSearch)}</b> — Abrir buscador</li>
        <li><b>{formatCombo(SHORTCUTS.openAI)}</b> — Lanzar asistente IA</li>
        <li><b>{formatCombo(SHORTCUTS.openNotes)}</b> — Ver notas</li>
      </ul>
    </Card>
  )
}
