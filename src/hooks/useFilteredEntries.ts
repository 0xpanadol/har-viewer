import { useMemo } from 'react'
import { useHarStore } from '../store/harStore'
import type { ParsedEntry } from '../utils/types'

export function useFilteredEntries(): ParsedEntry[] {
  const allEntries = useHarStore((s) => s.allEntries)
  const activeMethodFilters = useHarStore((s) => s.activeMethodFilters)
  const activeStatusFilters = useHarStore((s) => s.activeStatusFilters)
  const activeTypeFilters = useHarStore((s) => s.activeTypeFilters)
  const searchQuery = useHarStore((s) => s.searchQuery)
  const sortCol = useHarStore((s) => s.sortCol)
  const sortDir = useHarStore((s) => s.sortDir)

  return useMemo(() => {
    const q = searchQuery.toLowerCase()
    let result = allEntries.filter((e) => {
      if (activeMethodFilters.length && !activeMethodFilters.includes(e.method)) return false
      if (activeStatusFilters.length) {
        const sg = Math.floor(e.status / 100) + 'xx'
        if (!activeStatusFilters.includes(sg)) return false
      }
      if (activeTypeFilters.length && !activeTypeFilters.includes(e.contentType)) return false
      if (q) {
        const haystack = `${e.method} ${e.url} ${e.status} ${e.statusText} ${e.contentType}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    if (sortCol !== 'none') {
      const dir = sortDir === 'asc' ? 1 : -1
      result = [...result].sort((a, b) => {
        switch (sortCol) {
          case 'method': return a.method.localeCompare(b.method) * dir
          case 'url': return a.url.localeCompare(b.url) * dir
          case 'status': return (a.status - b.status) * dir
          case 'size': return (a.size - b.size) * dir
          case 'time': return (a.time - b.time) * dir
          case 'type': return a.contentType.localeCompare(b.contentType) * dir
          default: return 0
        }
      })
    }

    return result
  }, [allEntries, activeMethodFilters, activeStatusFilters, activeTypeFilters, searchQuery, sortCol, sortDir])
}
