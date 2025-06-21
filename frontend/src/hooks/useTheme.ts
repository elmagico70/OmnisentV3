// src/hooks/useTheme.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { themeConfig } from "@/config/theme"

interface ThemeStore {
  mode: "dark" | "light"
  toggleTheme: () => void
  setTheme: (mode: "dark" | "light") => void
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: themeConfig.mode,
      toggleTheme: () =>
        set((state) => ({
          mode: state.mode === "dark" ? "light" : "dark",
        })),
      setTheme: (mode) => set({ mode }),
    }),
    {
      name: "theme-storage", // localStorage key
    }
  )
)
