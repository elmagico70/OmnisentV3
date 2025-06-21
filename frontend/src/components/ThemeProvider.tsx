// src/components/ui/ThemeProvider.tsx
import * as React from "react"

type Theme = "light" | "dark"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "omnisent-theme",
}: ThemeProviderProps) {
  React.useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null
    const theme = stored || defaultTheme
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
    localStorage.setItem(storageKey, theme)
  }, [])

  return <>{children}</>
}
