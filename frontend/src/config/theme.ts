// src/config/theme.ts

export const themeConfig = {
  mode: "dark", // o "light" si lo deseas por defecto
  accentColor: "from-omni-cyan to-blue-600",
  fontFamily: "'Inter', sans-serif",
  borderRadius: "0.75rem", // 2xl
  layout: {
    sidebarWidth: 260,
    headerHeight: 48,
    tabHeight: 38,
  },
  animations: {
    transition: "all 0.2s ease-in-out",
    motion: true, // true = usar framer-motion
  },
  shadows: {
    card: "0px 2px 8px rgba(0,0,0,0.12)",
    button: "0px 2px 4px rgba(0,0,0,0.25)",
  },
}
