// src/components/ui/Card.tsx
import React from "react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CardProps {
  children: ReactNode
  className?: string
}

export const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm p-4",
        className
      )}
    >
      {children}
    </div>
  )
}