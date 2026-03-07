import { useMemo, useRef, useState, useEffect } from 'react'
import { useHarStore } from '../store/harStore'
import { useFilteredEntries } from '../hooks/useFilteredEntries'
import { FilterPills } from './FilterPills'
import { DomainFilter } from './DomainFilter'
import { ColumnToggle } from './ColumnToggle'
import { RangeFilters } from './RangeFilters'
import { FilterPresets } from './FilterPresets'
import { ValidationBadge } from './ValidationBadge'
import { ConfirmDialog } from './ConfirmDialog'
import { formatBytes, formatTime } from '../utils/formatters'
import { exportHarEntries, exportCsv, exportSanitizedHar, mergeHarLogs, exportPostmanCollection } from '../utils/exporters'
import type { HarLog, SearchScope } from '../utils/types'

interface Props {
  onOpenFile: () => void
}

/* ── tiny dropdown wrapper ── */
function DropMenu({ label, icon, children, badge }: { label: string; icon: React.ReactNode; children: React.ReactNode; badge?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="drop-menu" ref={ref}>
      <button className={`tool-btn tool-btn-icon ${open ? 'active' : ''}`} onClick={() => setOpen(!open)} title={label}>
        {icon}
        {badge}
      </button>
      {open && <div className="drop-menu-list" onClick={() => setOpen(false)}>{children}</div>}
    </div>
  )
}

function DropItem({ label, icon, onClick, active }: { label: string; icon?: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button className={`drop-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon && <span className="drop-item-icon">{icon}</span>}
      <span>{label}</span>
    </button>
  )
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
  const theme = useHarStore((s) => s.theme)
  const setTheme = useHarStore((s) => s.setTheme)
  const loadHarData = useHarStore((s) => s.loadHarData)
  const fileName = useHarStore((s) => s.fileName)
  const filteredEntries = useFilteredEntries()
  const mergeRef = useRef<HTMLInputElement>(null)
  const selectedIdx = useHarStore((s) => s.selectedIdx)
  const pinnedEntries = useHarStore((s) => s.pinnedEntries)
  const deleteEntries = useHarStore((s) => s.deleteEntries)
  const urlTooltipEnabled = useHarStore((s) => s.urlTooltipEnabled)
  const setUrlTooltipEnabled = useHarStore((s) => s.setUrlTooltipEnabled)
  const isDirty = useHarStore((s) => s.isDirty)
  const saveState = useHarStore((s) => s.saveState)
  const searchScope = useHarStore((s) => s.searchScope)
  const setSearchScope = useHarStore((s) => s.setSearchScope)
  const [confirmDelete, setConfirmDelete] = useState(false)

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
    () => Object.keys(methods).sort().map((m) => ({ label: m, count: methods[m], active: activeMethodFilters.includes(m) })),
    [methods, activeMethodFilters]
  )

  const statusPills = useMemo(
    () => ['2xx', '3xx', '4xx', '5xx'].filter((sg) => statuses[sg]).map((sg) => ({ label: sg, count: statuses[sg], active: activeStatusFilters.includes(sg) })),
    [statuses, activeStatusFilters]
  )

  const typeOrder = ['html', 'js', 'css', 'json', 'img', 'xml', 'text', 'font', 'bin']
  const typePills = useMemo(() => {
    const sorted = Object.keys(types).sort((a, b) => {
      const ai = typeOrder.indexOf(a); const bi = typeOrder.indexOf(b)
      if (ai !== -1 && bi !== -1) return ai - bi
      if (ai !== -1) return -1; if (bi !== -1) return 1
      return types[b] - types[a]
    })
    return sorted.map((t) => ({ label: t, count: types[t], active: activeTypeFilters.includes(t) }))
  }, [types, activeTypeFilters])

  const totalSize = useMemo(() => filteredEntries.reduce((s, e) => s + Math.max(0, e.size), 0), [filteredEntries])
  const totalTime = useMemo(() => filteredEntries.reduce((s, e) => s + Math.max(0, e.time), 0), [filteredEntries])

  const handleExport = () => {
    if (checkedEntries.length > 0) {
      const raw = allEntries.filter((e) => checkedEntries.includes(e._idx)).map((e) => e._raw)
      exportHarEntries(raw, 'selected', harData)
    } else if (filteredEntries.length) {
      exportHarEntries(filteredEntries.map((e) => e._raw), 'filtered', harData)
    }
  }

  const handleExportCsv = () => {
    if (checkedEntries.length > 0) {
      exportCsv(allEntries.filter((e) => checkedEntries.includes(e._idx)), 'selected')
    } else {
      exportCsv(filteredEntries, 'filtered')
    }
  }

  const handleExportSanitized = () => {
    const entries = checkedEntries.length > 0
      ? allEntries.filter((e) => checkedEntries.includes(e._idx)).map((e) => e._raw)
      : filteredEntries.map((e) => e._raw)
    exportSanitizedHar(entries, 'sanitized', harData)
  }

  const handleExportPostman = () => {
    const entries = checkedEntries.length > 0
      ? allEntries.filter((e) => checkedEntries.includes(e._idx)).map((e) => e._raw)
      : filteredEntries.map((e) => e._raw)
    exportPostmanCollection(entries, 'collection')
  }

  const handleDeleteSelected = () => {
    if (selectedIdx < 0) return
    if (pinnedEntries.includes(selectedIdx)) setConfirmDelete(true)
    else deleteEntries([selectedIdx], filteredEntries.map((e) => e._idx))
  }

  const handleMerge = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const log2: HarLog = data.log || data
      const merged = mergeHarLogs([{ log: harData!, fileName }, { log: log2, fileName: file.name }])
      loadHarData({ log: merged } as unknown as HarLog, `merged-${fileName}-${file.name}`)
    } catch { alert('Failed to parse HAR file for merge') }
  }

  const minTime = useHarStore((s) => s.minTime)
  const maxTime = useHarStore((s) => s.maxTime)
  const minSize = useHarStore((s) => s.minSize)
  const maxSize = useHarStore((s) => s.maxSize)
  const hasActiveFilters = !!(searchQuery || activeMethodFilters.length || activeStatusFilters.length || activeTypeFilters.length || minTime !== null || maxTime !== null || minSize !== null || maxSize !== null)

  const analyzeIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
  const exportIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )

  return (
    <>
    <div id="toolbar" className="visible">
      <input type="file" ref={mergeRef} accept=".har,.json" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMerge(f); if (mergeRef.current) mergeRef.current.value = '' }} />

      <div className="toolbar-row toolbar-row-main">
        {/* File: Open + Save */}
        <button className="tool-btn" onClick={onOpenFile} title="Open file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" /><polyline points="13 2 13 9 20 9" />
          </svg>
          <span className="btn-label">Open</span>
        </button>
        <button className={`tool-btn ${isDirty ? 'tool-btn-dirty' : ''}`} onClick={saveState} title="Save state (Ctrl+S)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
          </svg>
          <span className="btn-label">Save{isDirty ? ' •' : ''}</span>
        </button>

        {/* Search */}
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" id="search-input"
            placeholder={useRegex ? 'Regex filter...' : 'Filter URL, method, status...'}
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search and filter requests" />
          <div className="search-toggles">
            <button className={`search-toggle ${useRegex ? 'active' : ''}`} onClick={() => setUseRegex(!useRegex)} title="Use regex">.*</button>
            <button className={`search-toggle ${negateSearch ? 'active' : ''}`} onClick={() => setNegateSearch(!negateSearch)} title="Negate / exclude matches">!</button>
            <select
              className="search-scope-select"
              value={searchScope}
              onChange={(e) => setSearchScope(e.target.value as SearchScope)}
              title="Search scope"
              aria-label="Search scope"
            >
              <option value="url">URL</option>
              <option value="headers">Headers</option>
              <option value="body">Body</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>

        <div className="toolbar-actions">
          {/* Analyze dropdown */}
          <DropMenu label="Analyze" icon={analyzeIcon} badge={errorCount > 0 ? <span className="error-badge">{errorCount}</span> : undefined}>
            <DropItem label="Issues" active={overlayPanel === 'issues'} onClick={() => setOverlayPanel(overlayPanel === 'issues' ? 'none' : 'issues')} />
            <DropItem label="Statistics" active={overlayPanel === 'stats'} onClick={() => setOverlayPanel(overlayPanel === 'stats' ? 'none' : 'stats')} />
            <DropItem label="Performance" active={overlayPanel === 'perf'} onClick={() => setOverlayPanel(overlayPanel === 'perf' ? 'none' : 'perf')} />
            <DropItem label="Grouping" active={overlayPanel === 'grouping'} onClick={() => setOverlayPanel(overlayPanel === 'grouping' ? 'none' : 'grouping')} />
            <DropItem label="Timeline" active={overlayPanel === 'timeline'} onClick={() => setOverlayPanel(overlayPanel === 'timeline' ? 'none' : 'timeline')} />
            <DropItem label="Initiator" active={overlayPanel === 'initiator'} onClick={() => setOverlayPanel(overlayPanel === 'initiator' ? 'none' : 'initiator')} />
            <DropItem label="Compare" active={overlayPanel === 'compare'} onClick={() => setOverlayPanel(overlayPanel === 'compare' ? 'none' : 'compare')} />
          </DropMenu>

          {/* Export dropdown */}
          <DropMenu label="Export" icon={exportIcon}>
            <DropItem label="Export HAR" onClick={handleExport} />
            <DropItem label="Export CSV" onClick={handleExportCsv} />
            <DropItem label="Export Sanitized" onClick={handleExportSanitized} />
            <DropItem label="Export Postman" onClick={handleExportPostman} />
            <DropItem label="Merge HAR" onClick={() => mergeRef.current?.click()} />
          </DropMenu>

          <ColumnToggle />

          {selectedIdx >= 0 && (
            <button className="tool-btn tool-btn-icon tool-btn-delete" onClick={handleDeleteSelected} title="Delete selected request">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          )}

          <button className={`tool-btn tool-btn-icon ${urlTooltipEnabled ? 'active' : ''}`}
            onClick={() => setUrlTooltipEnabled(!urlTooltipEnabled)}
            title={urlTooltipEnabled ? 'Disable URL tooltip' : 'Enable URL tooltip'}>
            {urlTooltipEnabled ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>

          <button className="tool-btn tool-btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          {hasActiveFilters && (
            <button className="tool-btn tool-btn-icon tool-btn-reset" onClick={resetFilters} title="Reset all filters">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" /><path d="M3 3v5h5" />
              </svg>
            </button>
          )}

          <button className="tool-btn tool-btn-icon" onClick={clearData} title="Clear and load new file">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="toolbar-row toolbar-row-filters">
        <div className="filter-scroll">
          <FilterPills pills={methodPills} onToggle={toggleMethodFilter} dataAttr="method" />
          <div className="tool-sep" />
          <FilterPills pills={statusPills} onToggle={toggleStatusFilter} dataAttr="status" />
          <div className="tool-sep" />
          <FilterPills pills={typePills} onToggle={toggleTypeFilter} dataAttr="type" />
          <div className="tool-sep" />
          <DomainFilter />
          <div className="tool-sep" />
          <RangeFilters />
          <div className="tool-sep" />
          <FilterPresets />
          <ValidationBadge />
        </div>
        <div className="toolbar-stats">
          <span className="stat-chip"><b>{filteredEntries.length}</b>/{allEntries.length}</span>
          <span className="stat-chip"><b>{formatBytes(totalSize)}</b></span>
          <span className="stat-chip"><b>{formatTime(totalTime)}</b></span>
        </div>
      </div>
    </div>
    {confirmDelete && (
      <ConfirmDialog title="Delete pinned entry?" message="This request is pinned. Are you sure you want to delete it?"
        confirmLabel="Delete" variant="danger"
        onConfirm={() => { deleteEntries([selectedIdx], filteredEntries.map((e) => e._idx)); setConfirmDelete(false) }}
        onCancel={() => setConfirmDelete(false)} />
    )}
    </>
  )
}
