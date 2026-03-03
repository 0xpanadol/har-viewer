import { useMemo } from 'react'
import { useHarStore } from '../store/harStore'
import { useFilteredEntries } from '../hooks/useFilteredEntries'
import { FilterPills } from './FilterPills'
import { DomainFilter } from './DomainFilter'
import { ColumnToggle } from './ColumnToggle'
import { formatBytes, formatTime } from '../utils/formatters'
import { exportHarEntries } from '../utils/exporters'

interface Props {
  onOpenFile: () => void
}

export function Toolbar({ onOpenFile }: Props) {
  const allEntries = useHarStore((s) => s.allEntries)
  const searchQuery = useHarStore((s) => s.searchQuery)
  const setSearchQuery = useHarStore((s) => s.setSearchQuery)
  const useRegex = useHarStore((s) => s.useRegex)
  const setUseRegex = useHarStore((s) => s.setUseRegex)
  const negateSearch = useHarStore((s) => s.negateSearch)
  const setNegateSearch = useHarStore((s) => s.setNegateSearch)
  const activeMethodFilters = useHarStore((s) => s.activeMethodFilters)
  const activeStatusFilters = useHarStore((s) => s.activeStatusFilters)
  const activeTypeFilters = useHarStore((s) => s.activeTypeFilters)
  const toggleMethodFilter = useHarStore((s) => s.toggleMethodFilter)
  const toggleStatusFilter = useHarStore((s) => s.toggleStatusFilter)
  const toggleTypeFilter = useHarStore((s) => s.toggleTypeFilter)
  const checkedEntries = useHarStore((s) => s.checkedEntries)
  const clearData = useHarStore((s) => s.clearData)
  const resetFilters = useHarStore((s) => s.resetFilters)
  const harData = useHarStore((s) => s.harData)
  const overlayPanel = useHarStore((s) => s.overlayPanel)
  const setOverlayPanel = useHarStore((s) => s.setOverlayPanel)
  const filteredEntries = useFilteredEntries()

  const { methods, statuses, types } = useMemo(() => {
    const methods: Record<string, number> = {}
    const statuses: Record<string, number> = {}
    const types: Record<string, number> = {}
    allEntries.forEach((e) => {
      methods[e.method] = (methods[e.method] || 0) + 1
      const sg = Math.floor(e.status / 100) + 'xx'
      statuses[sg] = (statuses[sg] || 0) + 1
      if (e.contentType && e.contentType !== '—') types[e.contentType] = (types[e.contentType] || 0) + 1
    })
    return { methods, statuses, types }
  }, [allEntries])

  const errorCount = useMemo(() => allEntries.filter((e) => e.status >= 400).length, [allEntries])

  const methodPills = useMemo(
    () =>
      Object.keys(methods)
        .sort()
        .map((m) => ({ label: m, count: methods[m], active: activeMethodFilters.includes(m) })),
    [methods, activeMethodFilters]
  )

  const statusPills = useMemo(
    () =>
      ['2xx', '3xx', '4xx', '5xx']
        .filter((sg) => statuses[sg])
        .map((sg) => ({ label: sg, count: statuses[sg], active: activeStatusFilters.includes(sg) })),
    [statuses, activeStatusFilters]
  )

  const typeOrder = ['html', 'js', 'css', 'json', 'img', 'xml', 'text', 'font', 'bin']
  const typePills = useMemo(() => {
    const sorted = Object.keys(types).sort((a, b) => {
      const ai = typeOrder.indexOf(a)
      const bi = typeOrder.indexOf(b)
      if (ai !== -1 && bi !== -1) return ai - bi
      if (ai !== -1) return -1
      if (bi !== -1) return 1
      return types[b] - types[a]
    })
    return sorted.map((t) => ({ label: t, count: types[t], active: activeTypeFilters.includes(t) }))
  }, [types, activeTypeFilters])

  const totalSize = useMemo(
    () => filteredEntries.reduce((s, e) => s + Math.max(0, e.size), 0),
    [filteredEntries]
  )
  const totalTime = useMemo(
    () => filteredEntries.reduce((s, e) => s + Math.max(0, e.time), 0),
    [filteredEntries]
  )

  const handleExport = () => {
    if (checkedEntries.length > 0) {
      const raw = allEntries.filter((e) => checkedEntries.includes(e._idx)).map((e) => e._raw)
      exportHarEntries(raw, 'selected', harData)
    } else if (filteredEntries.length) {
      exportHarEntries(filteredEntries.map((e) => e._raw), 'filtered', harData)
    }
  }

  const hasActiveFilters = !!(searchQuery || activeMethodFilters.length || activeStatusFilters.length || activeTypeFilters.length)

  return (
    <div id="toolbar" className="visible">
      {/* Row 1: Open, Search, Actions */}
      <div className="toolbar-row toolbar-row-main">
        <button className="tool-btn" onClick={onOpenFile} title="Open file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
          <span className="btn-label">Open</span>
        </button>
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            id="search-input"
            placeholder={useRegex ? 'Regex filter...' : 'Filter URL, method, status...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="search-toggles">
            <button
              className={`search-toggle ${useRegex ? 'active' : ''}`}
              onClick={() => setUseRegex(!useRegex)}
              title="Use regex"
            >.*</button>
            <button
              className={`search-toggle ${negateSearch ? 'active' : ''}`}
              onClick={() => setNegateSearch(!negateSearch)}
              title="Negate / exclude matches"
            >!</button>
          </div>
        </div>
        <div className="toolbar-actions">
          <button
            className={`tool-btn tool-btn-icon ${overlayPanel === 'issues' ? 'active' : ''}`}
            onClick={() => setOverlayPanel(overlayPanel === 'issues' ? 'none' : 'issues')}
            title="Issues"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {errorCount > 0 ? <span className="error-badge">{errorCount}</span> : null}
          </button>
          <button
            className={`tool-btn tool-btn-icon ${overlayPanel === 'stats' ? 'active' : ''}`}
            onClick={() => setOverlayPanel(overlayPanel === 'stats' ? 'none' : 'stats')}
            title="Statistics"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </button>
          <ColumnToggle />
          <button className="tool-btn tool-btn-icon" onClick={handleExport} title="Export">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          {hasActiveFilters && (
            <button className="tool-btn tool-btn-icon tool-btn-reset" onClick={resetFilters} title="Reset all filters">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          )}
          <button className="tool-btn tool-btn-icon" onClick={clearData} title="Clear and load new file">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      {/* Row 2: Filters + Stats */}
      <div className="toolbar-row toolbar-row-filters">
        <div className="filter-scroll">
          <FilterPills pills={methodPills} onToggle={toggleMethodFilter} dataAttr="method" />
          <div className="tool-sep" />
          <FilterPills pills={statusPills} onToggle={toggleStatusFilter} dataAttr="status" />
          <div className="tool-sep" />
          <FilterPills pills={typePills} onToggle={toggleTypeFilter} dataAttr="type" />
          <div className="tool-sep" />
          <DomainFilter />
        </div>
        <div className="toolbar-stats">
          <span className="stat-chip"><b>{filteredEntries.length}</b>/{allEntries.length}</span>
          <span className="stat-chip"><b>{formatBytes(totalSize)}</b></span>
          <span className="stat-chip"><b>{formatTime(totalTime)}</b></span>
        </div>
      </div>
    </div>
  )
}
