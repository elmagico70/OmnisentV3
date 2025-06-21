import React from "react"

export const LoadingFallback = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">
      <span className="animate-pulse text-xl">Cargando Omnisent...</span>
    </div>
  )
}
