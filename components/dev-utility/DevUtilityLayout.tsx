'use client'

import { useCallback, useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { ToolConsole } from './ToolConsole'
import { ActiveToolContext } from './tools/useActiveTool'
import { FavoritesProvider } from './tools/useFavorites'

export function DevUtilityLayout({ initialTool = 'base64' }: { initialTool?: string }) {
  const [activeTool, setActiveToolState] = useState(initialTool)

  const syncToolFromUrl = useCallback(() => {
    const tool = new URLSearchParams(window.location.search).get('tool')
    setActiveToolState(tool || 'base64')
  }, [])

  useEffect(() => {
    window.addEventListener('popstate', syncToolFromUrl)
    return () => window.removeEventListener('popstate', syncToolFromUrl)
  }, [syncToolFromUrl])

  const setActiveTool = useCallback((toolId: string) => {
    setActiveToolState(toolId)

    const url = new URL(window.location.href)
    url.searchParams.set('tool', toolId)
    window.history.pushState(null, '', url)
  }, [])

  return (
    <FavoritesProvider>
      <ActiveToolContext.Provider value={{ activeTool, setActiveTool }}>
        <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-[1600px]">
          <Sidebar />
          <ToolConsole />
        </div>
      </ActiveToolContext.Provider>
    </FavoritesProvider>
  )
}
