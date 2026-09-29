import { useEffect } from 'react'
import { useAppStore } from '@/store'
import { useMediaQuery } from './use-media-query'

export function useResolvedTheme(): 'light' | 'dark' {
  const preference = useAppStore((s) => s.theme)
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  if (preference === 'system') return systemDark ? 'dark' : 'light'
  return preference
}

/** Mirrors the resolved theme onto <html> (the inline script in index.html sets it pre-paint). */
export function useThemeEffect(): void {
  const theme = useResolvedTheme()
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.style.colorScheme = theme
  }, [theme])
}
