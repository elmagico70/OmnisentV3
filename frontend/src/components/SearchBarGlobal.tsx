// src/components/ui/SearchBarGlobal.tsx
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, X } from "lucide-react"

const DATA: { label: string; path: string }[] = [
  { label: "Buscar archivos", path: "/search" },
  { label: "Notas", path: "/notes" },
  { label: "Asistente IA", path: "/ai" },
  { label: "Configuración", path: "/settings" },
  { label: "Dashboard", path: "/" },
]

export const SearchBarGlobal = () => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const navigate = useNavigate()

  const filtered = DATA.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [])

  const handleSelect = (path: string) => {
    navigate(path)
    setOpen(false)
    setQuery("")
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded shadow-lg w-full max-w-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search size={18} className="text-cyan-400" />
          <input
            autoFocus
            className="w-full bg-transparent text-white outline-none"
            placeholder="Buscar comando o sección..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <ul className="space-y-2">
          {filtered.map((item) => (
            <li
              key={item.path}
              className="hover:bg-zinc-800 p-2 rounded cursor-pointer text-sm text-zinc-200"
              onClick={() => handleSelect(item.path)}
            >
              {item.label}
            </li>
          ))}
          {filtered.length === 0 && <p className="text-zinc-500">Sin resultados</p>}
        </ul>
      </div>
    </div>
  )
}
