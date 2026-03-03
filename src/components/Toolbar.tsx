import { useMemo } from 'react'
import { useHarStore } from '../store/harStore'
import { useFilteredEntries } from '../hooks/useFilteredEntries'
import { FilterPills } from './FilterPills'
import { formatBytes, formatTime } from '../utils/formatters'
import { exportHarEntries } from '../utils/exporters'

interface Props {
  onOpenFile: () => void
}

export function Toolbar({ onOpenFile }: Props) {
  const allEntries = useHarStore((s) => s.allEntries)
  const searchQuery = useHarStore((s) => s.searchQuery)
  const setSearchQuery = useHarStore((s) => s.setSearchQuery)
  const activeMethodFilters = useHarStore((s) => s.activeMethodFilters)
  const activeStatusFilters = useHarStore((s) => s.activeStatusFilters)
  const activeTypeFilters = useHarStore((s) => s.activeTypeFilters)
  const toggleMethodFilter = useHarStore((s) => s.toggleMethodFilter)
  const toggleStatusFilter = useHarStore((s) => s.toggleStatusFilter)
  const toggleTypeFilter = useHarStore((s) => s.toggleTypeFilter)
  const checkedEntries = useHarStore((s) => s.checkedEntries)
  const clearData = useHarStore((s) => s.clearData)
  const harData = useHarStore((s) => s.harData)
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

  return (
    <div id="toolbar" className="visible">
      <div className="tool-group">
        <button className="tool-btn" onClick={onOpenFile} title="Open file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
          Open
        </button>
      </div>
      <div className="tool-sep" />
      <div className="search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          id="search-input"
          placeholder="Filter by URL, method, status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="tool-sep" />
      <FilterPills pills={methodPills} onToggle={toggleMethodFilter} dataAttr="method" />
      <div className="tool-sep" />
      <FilterPills pills={statusPills} onToggle={toggleStatusFilter} dataAttr="status" />
      <div className="tool-sep" />
      <FilterPills pills={typePills} onToggle={toggleTypeFilter} dataAttr="type" />
      <div className="toolbar-right">
        <div className="stat-chip">
          <b>{filteredEntries.length}</b>/{allEntries.length} requests
        </div>
        <div className="tool-sep" />
        <div className="stat-chip">
          <b>{formatBytes(totalSize)}</b>
        </div>
        <div className="tool-sep" />
        <div className="stat-chip">
          <b>{formatTime(totalTime)}</b> total
        </div>
        <div className="tool-sep" />
        <button className="tool-btn" onClick={handleExport} title="Export filtered entries">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>
        <button className="tool-btn" onClick={clearData} title="Clear and load new file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}
