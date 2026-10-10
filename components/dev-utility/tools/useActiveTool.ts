'use client'

import { createContext, useContext } from 'react'

interface ActiveToolContextValue {
  activeTool: string
  setActiveTool: (toolId: string) => void
}

export const ActiveToolContext = createContext<ActiveToolContextValue | null>(null)

export function useActiveTool() {
  const context = useContext(ActiveToolContext)

  if (!context) {
    throw new Error('useActiveTool must be used within DevUtilityLayout')
  }

  return context
}
