import { useMemo } from 'react'
import { useHarStore } from '../store/harStore'
import type { ParsedEntry } from '../utils/types'

export function useFilteredEntries(): ParsedEntry[] {
  const allEntries = useHarStore((s) => s.allEntries)
  const activeMethodFilters = useHarStore((s) => s.activeMethodFilters)
  const activeStatusFilters = useHarStore((s) => s.activeStatusFilters)
  const activeTypeFilters = useHarStore((s) => s.activeTypeFilters)
  const activeDomainFilters = useHarStore((s) => s.activeDomainFilters)
  const pinnedEntries = useHarStore((s) => s.pinnedEntries)
  const searchQuery = useHarStore((s) => s.searchQuery)
  const useRegex = useHarStore((s) => s.useRegex)
  const negateSearch = useHarStore((s) => s.negateSearch)
  const sortCol = useHarStore((s) => s.sortCol)
  const sortDir = useHarStore((s) => s.sortDir)

  return useMemo(() => {
    let regex: RegExp | null = null
    let plainQ = ''

    if (searchQuery) {
      if (useRegex) {
        try { regex = new RegExp(searchQuery, 'i') } catch { /* invalid regex, treat as plain */ }
      }
      if (!regex) plainQ = searchQuery.toLowerCase()
    }

    let result = allEntries.filter((e) => {
      if (activeMethodFilters.length && !activeMethodFilters.includes(e.method)) return false
      if (activeStatusFilters.length) {
        const sg = Math.floor(e.status / 100) + 'xx'
        if (!activeStatusFilters.includes(sg)) return false
      }
      if (activeTypeFilters.length && !activeTypeFilters.includes(e.contentType)) return false
      if (activeDomainFilters.length && !activeDomainFilters.includes(e.host)) return false

      if (searchQuery) {
        const haystack = `${e.method} ${e.url} ${e.status} ${e.statusText} ${e.contentType}`
        let matches: boolean
        if (regex) {
          matches = regex.test(haystack)
        } else {
          matches = haystack.toLowerCase().includes(plainQ)
        }
        if (negateSearch) matches = !matches
        if (!matches) return false
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

    // Pinned entries float to top
    if (pinnedEntries.length > 0) {
      const pinned = result.filter((e) => pinnedEntries.includes(e._idx))
      const unpinned = result.filter((e) => !pinnedEntries.includes(e._idx))
      result = [...pinned, ...unpinned]
    }

    return result
  }, [allEntries, activeMethodFilters, activeStatusFilters, activeTypeFilters, activeDomainFilters, pinnedEntries, searchQuery, useRegex, negateSearch, sortCol, sortDir])
}
