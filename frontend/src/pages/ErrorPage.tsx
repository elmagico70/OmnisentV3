import React from "react"

export const ErrorPage = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">Error 404</h1>
        <p className="text-lg">La ruta que estás buscando no existe o ha fallado.</p>
      </div>
    </div>
  )
}
