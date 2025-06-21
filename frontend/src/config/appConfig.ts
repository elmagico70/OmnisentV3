// src/config/appConfig.ts

export const APP_NAME = "Omnisent2"
export const APP_VERSION = "v0.1.0-dev"

export const DEFAULT_LANGUAGE = "es"
export const DEFAULT_THEME = "dark"

export const API_URL = "http://localhost:8000" // Para FastAPI (futuro)
export const SEARCH_INDEX_PATH = "C:/OmnisentIndex" // Ruta local para leaks/indexador

export const SUPPORTED_MODELS = [
  { name: "GPT-4o (Cloud)", id: "gpt-4o" },
  { name: "Claude 3 Opus", id: "claude-opus" },
  { name: "Phi-3 Local", id: "phi-3" },
  { name: "Mistral (Ollama)", id: "mistral" },
]

export const SHORTCUTS = {
  openSearch: "ctrl+shift+f",
  toggleTheme: "ctrl+shift+t",
  openAI: "ctrl+alt+a",
  openNotes: "ctrl+alt+n",
}

export const PATHS = {
  logs: "C:/OmnisentLogs/",
  export: "C:/OmnisentExports/",
  userData: "C:/OmnisentData/",
}
