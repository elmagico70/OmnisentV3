// src/hooks/useKeyboardShortcuts.ts
import { useEffect } from "react"
import { SHORTCUTS } from "@/config/appConfig"

interface ShortcutMap {
  [combo: string]: () => void
}

export const useKeyboardShortcuts = (actions: ShortcutMap) => {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const combo = [
        e.ctrlKey ? "ctrl" : null,
        e.shiftKey ? "shift" : null,
        e.altKey ? "alt" : null,
        e.key?.toLowerCase(),
      ]
        .filter(Boolean)
        .join("+")

      if (actions[combo]) {
        e.preventDefault()
        actions[combo]()
      }
    }

    window.addEventListener("keydown", handle)
    return () => window.removeEventListener("keydown", handle)
  }, [actions])
}