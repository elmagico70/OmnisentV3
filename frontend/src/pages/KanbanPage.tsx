// modules/tasks/KanbanPage.tsx
import React, { useState } from "react"
import { useKanbanStore, Status } from "@/store/useKanbanStore"

const STATUSES: Status[] = ["pendiente", "progreso", "hecho"]
const statusLabels: Record<Status, string> = {
  pendiente: "📌 Pendiente",
  progreso: "🚧 En progreso",
  hecho: "✅ Hecho",
}

export const KanbanPage = () => {
  const { tasks, addTask, moveTask } = useKanbanStore()
  const [newTitle, setNewTitle] = useState("")

  const handleAdd = () => {
    if (newTitle.trim()) {
      addTask(newTitle.trim(), "pendiente")
      setNewTitle("")
    }
  }

  return (
    <div className="p-6 space-y-4 text-zinc-100">
      <h1 className="text-xl font-bold text-cyan-400">📋 Kanban</h1>
      <div className="flex items-center gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nueva tarea..."
          className="bg-zinc-800 border border-zinc-700 p-2 rounded w-full"
        />
        <button onClick={handleAdd} className="omni-btn">Agregar</button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {STATUSES.map((status) => (
          <div key={status} className="bg-zinc-900 border border-zinc-700 rounded p-3 space-y-2">
            <h2 className="text-cyan-300 font-semibold">{statusLabels[status]}</h2>
            {tasks.filter((t) => t.status === status).map((task) => (
              <div
                key={task.id}
                className="bg-zinc-800 p-2 rounded text-sm flex justify-between items-center"
              >
                <span>{task.title}</span>
                <select
                  value={task.status}
                  onChange={(e) => moveTask(task.id, e.target.value as Status)}
                  className="bg-zinc-700 text-xs rounded px-1 py-0.5"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabels[s].replace(/[^a-zA-Z ]/g, "")}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}