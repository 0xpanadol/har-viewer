import { useMemo } from 'react'
import { useHarStore } from '../store/harStore'
import type { ParsedEntry, SearchMatchLocation } from '../utils/types'
import { getSearchMatchLocations } from '../utils/searchMatch'

export interface FilteredEntriesResult {
  entries: ParsedEntry[]
  matchLocations: Map<number, SearchMatchLocation>
}

export function useFilteredEntries(): FilteredEntriesResult {
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
  const minTime = useHarStore((s) => s.minTime)
  const maxTime = useHarStore((s) => s.maxTime)
  const minSize = useHarStore((s) => s.minSize)
  const maxSize = useHarStore((s) => s.maxSize)
  const searchScope = useHarStore((s) => s.searchScope)

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

      // Time range filters
      if (minTime !== null && e.time < minTime) return false
      if (maxTime !== null && e.time > maxTime) return false
      // Size range filters
      if (minSize !== null && e.size < minSize) return false
      if (maxSize !== null && e.size > maxSize) return false

      if (searchQuery) {
        let haystack: string
        if (searchScope === 'url') {
          haystack = `${e.method} ${e.url} ${e.status} ${e.statusText} ${e.contentType}`
        } else if (searchScope === 'headers') {
          const reqHeaders = (e._raw.request?.headers || []).map((h) => `${h.name}: ${h.value}`).join(' ')
          const resHeaders = (e._raw.response?.headers || []).map((h) => `${h.name}: ${h.value}`).join(' ')
          haystack = `${reqHeaders} ${resHeaders}`
        } else if (searchScope === 'body') {
          haystack = `${e._raw.request?.postData?.text || ''} ${e._raw.response?.content?.text || ''}`
        } else {
          // 'all'
          const reqHeaders = (e._raw.request?.headers || []).map((h) => `${h.name}: ${h.value}`).join(' ')
          const resHeaders = (e._raw.response?.headers || []).map((h) => `${h.name}: ${h.value}`).join(' ')
          haystack = `${e.method} ${e.url} ${e.status} ${e.statusText} ${e.contentType} ${reqHeaders} ${resHeaders} ${e._raw.request?.postData?.text || ''} ${e._raw.response?.content?.text || ''}`
        }
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

    // Compute match locations for each filtered entry
    const matchLocations = new Map<number, SearchMatchLocation>()
    if (searchQuery && searchQuery.length >= 2) {
      result.forEach((e) => {
        matchLocations.set(e._idx, getSearchMatchLocations(e, searchQuery, useRegex))
      })
    }

    return { entries: result, matchLocations }
  }, [allEntries, activeMethodFilters, activeStatusFilters, activeTypeFilters, activeDomainFilters, pinnedEntries, searchQuery, useRegex, negateSearch, sortCol, sortDir, minTime, maxTime, minSize, maxSize, searchScope])
}
