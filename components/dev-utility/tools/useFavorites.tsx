'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'dev-utility-favorites'

function getStoredFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

type FavoritesContextValue = {
  favorites: string[]
  toggleFavorite: (toolId: string) => void
  isFavorite: (toolId: string) => boolean
  loaded: boolean
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setFavorites(getStoredFavorites())
      setLoaded(true)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const toggleFavorite = useCallback((toolId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (toolId: string) => favorites.includes(toolId),
    [favorites]
  )

  const value = useMemo(
    () => ({ favorites, toggleFavorite, isFavorite, loaded }),
    [favorites, toggleFavorite, isFavorite, loaded]
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider')
  return context
}
