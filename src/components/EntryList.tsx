import { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useHarStore } from '../store/harStore'
import { useFilteredEntries } from '../hooks/useFilteredEntries'
import { formatBytes, formatTime, timeClass, statusClass } from '../utils/formatters'
import { parseUrl } from '../utils/parsers'
import { ContextMenu } from './ContextMenu'
import { NoteEditor } from './NoteEditor'
import { ConfirmDialog } from './ConfirmDialog'
import type { ParsedEntry, SortColumn, VisibleColumns, SearchScope, SearchMatchLocation } from '../utils/types'
import { getBestTabForMatch } from '../utils/searchMatch'
import { showToast } from './Toast'

const ROW_H = 32

function buildGridCols(vc: VisibleColumns): string {
  const parts = ['28px', '36px']
  if (vc.method) parts.push('60px')
  if (vc.url) parts.push('minmax(100px,1fr)')
  if (vc.status) parts.push('120px')
  if (vc.type) parts.push('80px')
  if (vc.size) parts.push('80px')
  if (vc.time) parts.push('80px')
  if (vc.waterfall) parts.push('1fr')
  return parts.join(' ')
}

export function EntryList() {
  const { entries: filteredEntries, matchLocations } = useFilteredEntries()
  const selectedIdx = useHarStore((s) => s.selectedIdx)
  const setSelectedIdx = useHarStore((s) => s.setSelectedIdx)
  const setDetailPanelOpen = useHarStore((s) => s.setDetailPanelOpen)
  const checkedEntries = useHarStore((s) => s.checkedEntries)
  const pinnedEntries = useHarStore((s) => s.pinnedEntries)
  const toggleCheck = useHarStore((s) => s.toggleCheck)
  const checkAll = useHarStore((s) => s.checkAll)
  const uncheckAll = useHarStore((s) => s.uncheckAll)
  const sortCol = useHarStore((s) => s.sortCol)
  const toggleSort = useHarStore((s) => s.toggleSort)
  const waterfallStart = useHarStore((s) => s.waterfallStart)
  const waterfallEnd = useHarStore((s) => s.waterfallEnd)
  const scrollTop = useHarStore((s) => s.scrollTop)
  const setScrollTop = useHarStore((s) => s.setScrollTop)
  const visibleColumns = useHarStore((s) => s.visibleColumns)
  const annotations = useHarStore((s) => s.annotations)
  const allEntries = useHarStore((s) => s.allEntries)
  const addAnnotation = useHarStore((s) => s.addAnnotation)
  const removeAnnotation = useHarStore((s) => s.removeAnnotation)
  const deleteEntries = useHarStore((s) => s.deleteEntries)
  const urlTooltipEnabled = useHarStore((s) => s.urlTooltipEnabled)
  const searchQuery = useHarStore((s) => s.searchQuery)
  const setSearchQuery = useHarStore((s) => s.setSearchQuery)
  const useRegex = useHarStore((s) => s.useRegex)
  const setUseRegex = useHarStore((s) => s.setUseRegex)
  const negateSearch = useHarStore((s) => s.negateSearch)
  const setNegateSearch = useHarStore((s) => s.setNegateSearch)
  const searchScope = useHarStore((s) => s.searchScope)
  const setSearchScope = useHarStore((s) => s.setSearchScope)
  const setActiveDetailTab = useHarStore((s) => s.setActiveDetailTab)

  const parentRef = useRef<HTMLDivElement>(null)
  const lastCheckedRef = useRef<number>(-1)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; entry: ParsedEntry } | null>(null)
  const [notePopup, setNotePopup] = useState<number | null>(null)
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null)
  const [urlTip, setUrlTip] = useState<{ x: number; y: number; entry: ParsedEntry } | null>(null)
  const urlTipTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const urlTipDismissTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const urlTipHovered = useRef(false)
  const scrollRestoredRef = useRef(false)

  const showUrlTip = useCallback((rect: DOMRect, entry: ParsedEntry) => {
    if (!urlTooltipEnabled) return
    if (urlTipDismissTimer.current) clearTimeout(urlTipDismissTimer.current)
    if (urlTipTimer.current) clearTimeout(urlTipTimer.current)
    urlTipTimer.current = setTimeout(() => {
      const tipW = 480
      const tipH = 100
      const tx = Math.min(rect.left, window.innerWidth - tipW - 16)
      const ty = rect.bottom + 6 + tipH > window.innerHeight ? rect.top - tipH - 6 : rect.bottom + 6
      setUrlTip({ x: tx, y: ty, entry })
    }, 500)
  }, [urlTooltipEnabled])

  const dismissUrlTip = useCallback(() => {
    if (urlTipTimer.current) clearTimeout(urlTipTimer.current)
    urlTipDismissTimer.current = setTimeout(() => {
      if (!urlTipHovered.current) setUrlTip(null)
    }, 150)
  }, [])

  const gridCols = useMemo(() => buildGridCols(visibleColumns), [visibleColumns])

  // Duplicate detection for highlighting
  const duplicateSet = useMemo(() => {
    const urlMethodCount: Record<string, number> = {}
    allEntries.forEach((e) => {
      const key = `${e.method}:${e.url}`
      urlMethodCount[key] = (urlMethodCount[key] || 0) + 1
    })
    const dupes = new Set<string>()
    Object.entries(urlMethodCount).forEach(([key, count]) => {
      if (count > 1) dupes.add(key)
    })
    return dupes
  }, [allEntries])

  const annotationMap = useMemo(() => {
    const map = new Map<number, string>()
    annotations.forEach((a) => map.set(a.entryIdx, a.text))
    return map
  }, [annotations])

  const virtualizer = useVirtualizer({
    count: filteredEntries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 15,
  })

  useEffect(() => {
    if (parentRef.current && scrollTop > 0 && !scrollRestoredRef.current && filteredEntries.length > 0) {
      parentRef.current.scrollTop = scrollTop
      scrollRestoredRef.current = true
    }
  }, [filteredEntries.length])

  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const handleScroll = useCallback(() => {
    if (urlTipTimer.current) clearTimeout(urlTipTimer.current)
    if (urlTipDismissTimer.current) clearTimeout(urlTipDismissTimer.current)
    setUrlTip(null)
    urlTipHovered.current = false
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => {
      if (parentRef.current) setScrollTop(parentRef.current.scrollTop)
    }, 200)
  }, [setScrollTop])

  const handleSelectEntry = useCallback(
    (idx: number) => {
      setSelectedIdx(idx)
      setDetailPanelOpen(true)
      // Auto-switch to the best tab when there's an active search
      const loc = matchLocations.get(idx)
      if (loc) {
        const bestTab = getBestTabForMatch(loc)
        if (bestTab) setActiveDetailTab(bestTab)
      }
    },
    [setSelectedIdx, setDetailPanelOpen, matchLocations, setActiveDetailTab]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, entry: ParsedEntry) => {
      e.preventDefault()
      setCtxMenu({ x: e.clientX, y: e.clientY, entry })
    },
    []
  )

  const allChecked = filteredEntries.length > 0 && filteredEntries.every((e) => checkedEntries.includes(e._idx))
  const someChecked = filteredEntries.some((e) => checkedEntries.includes(e._idx))

  const handleSelectAll = useCallback(() => {
    const indices = filteredEntries.map((e) => e._idx)
    if (allChecked) uncheckAll(indices)
    else checkAll(indices)
  }, [filteredEntries, allChecked, checkAll, uncheckAll])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useHarStore.getState().setDetailPanelOpen(false)
        useHarStore.getState().setSelectedIdx(-1)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        // If detail panel is open, let DetailPanel's capture-phase handler take it
        if (useHarStore.getState().detailPanelOpen) return
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useHarStore.getState()
        if (state.selectedIdx >= 0 && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault()
          if (state.pinnedEntries.includes(state.selectedIdx)) {
            setConfirmDeleteIdx(state.selectedIdx)
          } else {
            state.deleteEntries([state.selectedIdx], filteredEntries.map((en) => en._idx))
          }
        }
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!filteredEntries.length) return
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
        e.preventDefault()
        const state = useHarStore.getState()
        let curIdx = filteredEntries.findIndex((e) => e._idx === state.selectedIdx)
        if (e.key === 'ArrowDown') curIdx = Math.min(filteredEntries.length - 1, curIdx + 1)
        else curIdx = Math.max(0, curIdx - 1)
        if (curIdx < 0) curIdx = 0
        handleSelectEntry(filteredEntries[curIdx]._idx)
        virtualizer.scrollToIndex(curIdx, { align: 'auto' })
      }
      // Enter to toggle detail panel
      if (e.key === 'Enter' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        const state = useHarStore.getState()
        if (state.selectedIdx >= 0) {
          e.preventDefault()
          state.setDetailPanelOpen(!state.detailPanelOpen)
        }
      }
      // Tab to cycle detail tabs when panel is open
      if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        const state = useHarStore.getState()
        if (state.detailPanelOpen && state.selectedIdx >= 0) {
          e.preventDefault()
          const tabs: Array<'headers' | 'payload' | 'response' | 'cookies' | 'timing' | 'raw'> = ['headers', 'payload', 'response', 'cookies', 'timing', 'raw']
          const curTabIdx = tabs.indexOf(state.activeDetailTab)
          const nextTabIdx = e.shiftKey
            ? (curTabIdx - 1 + tabs.length) % tabs.length
            : (curTabIdx + 1) % tabs.length
          state.setActiveDetailTab(tabs[nextTabIdx])
        }
      }
      // Home/End to jump to first/last entry
      if ((e.key === 'Home' || e.key === 'End') && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        if (!filteredEntries.length) return
        e.preventDefault()
        const idx = e.key === 'Home' ? 0 : filteredEntries.length - 1
        handleSelectEntry(filteredEntries[idx]._idx)
        virtualizer.scrollToIndex(idx, { align: 'auto' })
      }
      // Page Up/Down to jump 20 entries
      if ((e.key === 'PageUp' || e.key === 'PageDown') && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        if (!filteredEntries.length) return
        e.preventDefault()
        const state = useHarStore.getState()
        let curIdx = filteredEntries.findIndex((en) => en._idx === state.selectedIdx)
        if (curIdx < 0) curIdx = 0
        const step = 20
        if (e.key === 'PageDown') curIdx = Math.min(filteredEntries.length - 1, curIdx + step)
        else curIdx = Math.max(0, curIdx - step)
        handleSelectEntry(filteredEntries[curIdx]._idx)
        virtualizer.scrollToIndex(curIdx, { align: 'auto' })
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [filteredEntries, handleSelectEntry, virtualizer])

  const wfRange = waterfallEnd - waterfallStart || 1
  const vc = visibleColumns

  const getSortClass = (col: SortColumn) => {
    if (sortCol !== col) return 'sortable'
    return `sortable sorted ${useHarStore.getState().sortDir}`
  }

  return (
    <div id="entry-list-wrap" role="region" aria-label="Request list">
      <div id="entry-header" style={{ gridTemplateColumns: gridCols }} role="row" aria-label="Column headers">
        <div className="hdr-check">
          <input
            type="checkbox"
            checked={allChecked}
            ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked }}
            onChange={handleSelectAll}
            title="Select all"
          />
        </div>
        <div>#</div>
        {vc.method && <div className={getSortClass('method')} onClick={() => toggleSort('method')}>Method</div>}
        {vc.url && <div className={getSortClass('url')} onClick={() => toggleSort('url')}>URL</div>}
        {vc.status && <div className={getSortClass('status')} onClick={() => toggleSort('status')}>Status</div>}
        {vc.type && <div className={getSortClass('type')} onClick={() => toggleSort('type')}>Type</div>}
        {vc.size && <div className={getSortClass('size')} onClick={() => toggleSort('size')}>Size</div>}
        {vc.time && <div className={getSortClass('time')} onClick={() => toggleSort('time')}>Time</div>}
        {vc.waterfall && <div>Waterfall</div>}
      </div>

      <div id="entry-scroll" ref={parentRef} onScroll={handleScroll}>
        <div id="entry-container" style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const entry = filteredEntries[virtualRow.index]
            if (!entry) return null
            const isSelected = entry._idx === selectedIdx
            const isChecked = checkedEntries.includes(entry._idx)
            const isPinned = pinnedEntries.includes(entry._idx)
            const isDuplicate = duplicateSet.has(`${entry.method}:${entry.url}`)
            const annotation = annotationMap.get(entry._idx)
            const parsed = parseUrl(entry.url)

            return (
              <div
                key={virtualRow.key}
                className={`entry-row ${isSelected ? 'selected' : ''} ${isChecked ? 'checked' : ''} ${isPinned ? 'pinned' : ''} ${isDuplicate ? 'duplicate' : ''}`}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ROW_H, transform: `translateY(${virtualRow.start}px)`, gridTemplateColumns: gridCols }}
                onClick={() => handleSelectEntry(entry._idx)}
                onContextMenu={(e) => handleContextMenu(e, entry)}
                title={annotation ? `📝 ${annotation}` : undefined}
              >
                <div className="entry-check">
                  <input
                    type="checkbox"
                    tabIndex={-1}
                    checked={isChecked}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (e.shiftKey && lastCheckedRef.current >= 0) {
                        const lastPos = filteredEntries.findIndex((fe) => fe._idx === lastCheckedRef.current)
                        const curPos = virtualRow.index
                        if (lastPos >= 0 && curPos >= 0) {
                          const start = Math.min(lastPos, curPos)
                          const end = Math.max(lastPos, curPos)
                          const rangeIndices = filteredEntries.slice(start, end + 1).map((fe) => fe._idx)
                          checkAll(rangeIndices)
                        }
                      }
                    }}
                    onChange={() => { toggleCheck(entry._idx); lastCheckedRef.current = entry._idx }}
                    aria-label={`Select entry ${entry._idx + 1}`}
                  />
                </div>
                <div className="entry-idx">
                  {isPinned && <span className="pin-icon">★</span>}
                  {annotation && <span style={{ color: 'var(--yellow)', fontSize: 8, marginRight: 1, cursor: 'pointer' }} title="Click to edit note" onClick={(e) => { e.stopPropagation(); setNotePopup(entry._idx) }}>📝</span>}
                  {entry._idx + 1}
                </div>
                {vc.method && <div className={`entry-method ${entry.method}`}>{entry.method}</div>}
                {vc.url && (
                  <div
                    className="entry-url"
                    onMouseEnter={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      showUrlTip(rect, entry)
                    }}
                    onMouseLeave={dismissUrlTip}
                  >
                    {isDuplicate && <span style={{ color: 'var(--orange)', fontSize: 9, marginRight: 2 }} title="Duplicate request">⊘</span>}
                    <span className="host">{parsed.host}</span>
                    <span className="path">{parsed.path.length > 80 ? parsed.path.slice(0, 80) + '…' : parsed.path}</span>
                  </div>
                )}
                {vc.status && <div className={`entry-status ${statusClass(entry.status)}`}>{entry.status || '—'}{searchQuery.length >= 2 && <MatchBadges loc={matchLocations.get(entry._idx)} />}</div>}
                {vc.type && <div className="entry-type">{entry.contentType}</div>}
                {vc.size && (
                  <div className="entry-size" title={entry.transferSize >= 0 && entry.transferSize !== entry.size ? `Transfer: ${formatBytes(entry.transferSize)} / Content: ${formatBytes(entry.size)}` : undefined}>
                    {entry.size >= 0 ? formatBytes(entry.size) : '—'}
                    {entry.transferSize >= 0 && entry.transferSize !== entry.size && (
                      <span className="transfer-size"> ({formatBytes(entry.transferSize)})</span>
                    )}
                  </div>
                )}
                {vc.time && <div className={`entry-time ${timeClass(entry.time)}`}>{formatTime(entry.time)}</div>}
                {vc.waterfall && <WaterfallCell entry={entry} wfRange={wfRange} waterfallStart={waterfallStart} />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="entry-search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="entry-search-icon">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" id="search-input"
          placeholder={useRegex ? 'Regex filter...' : 'Filter URL, method, status...'}
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search and filter requests" />
        {searchQuery.length >= 2 && (
          <span className="entry-search-count">{filteredEntries.length} match{filteredEntries.length !== 1 ? 'es' : ''}</span>
        )}
        <div className="entry-search-toggles">
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

      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} entry={ctxMenu.entry} onClose={() => setCtxMenu(null)} />
      )}
      {notePopup !== null && (() => {
        const noteEntry = allEntries[notePopup]
        return (
          <NoteEditor
            entryLabel={noteEntry ? `#${noteEntry._idx + 1} ${noteEntry.method} ${noteEntry.url}` : ''}
            initialText={annotations.find((a) => a.entryIdx === notePopup)?.text || ''}
            onSave={(text) => { addAnnotation(notePopup, text); setNotePopup(null) }}
            onDelete={() => { removeAnnotation(notePopup); setNotePopup(null) }}
            onClose={() => setNotePopup(null)}
          />
        )
      })()}
      {confirmDeleteIdx !== null && (
        <ConfirmDialog
          title="Delete pinned entry?"
          message="This request is pinned. Are you sure you want to delete it?"
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => { deleteEntries([confirmDeleteIdx], filteredEntries.map((e) => e._idx)); setConfirmDeleteIdx(null) }}
          onCancel={() => setConfirmDeleteIdx(null)}
        />
      )}
      {urlTip && createPortal(
        <div
          onMouseEnter={() => { urlTipHovered.current = true; if (urlTipDismissTimer.current) clearTimeout(urlTipDismissTimer.current) }}
          onMouseLeave={() => { urlTipHovered.current = false; setUrlTip(null) }}
        >
          <UrlTooltip x={urlTip.x} y={urlTip.y} entry={urlTip.entry} />
        </div>,
        document.body
      )}
    </div>
  )
}

function MatchBadges({ loc }: { loc?: SearchMatchLocation }) {
  if (!loc) return null
  const badges: { label: string; title: string; cls: string }[] = []
  if (loc.url) badges.push({ label: 'U', title: 'Match in URL', cls: 'match-badge-url' })
  if (loc.headers) badges.push({ label: 'H', title: 'Match in Headers', cls: 'match-badge-headers' })
  if (loc.requestBody) badges.push({ label: 'Q', title: 'Match in Request Body', cls: 'match-badge-req' })
  if (loc.responseBody) badges.push({ label: 'R', title: 'Match in Response Body', cls: 'match-badge-res' })
  if (loc.cookies) badges.push({ label: 'C', title: 'Match in Cookies', cls: 'match-badge-cookies' })
  if (badges.length === 0) return null
  return (
    <div className="match-badges">
      {badges.map((b) => (
        <span key={b.label} className={`match-badge ${b.cls}`} title={b.title}>{b.label}</span>
      ))}
    </div>
  )
}

function UrlTooltip({ x, y, entry }: { x: number; y: number; entry: ParsedEntry }) {
  let queryParams: { key: string; val: string }[] = []
  try {
    const u = new URL(entry.url)
    queryParams = [...u.searchParams.entries()].map(([k, v]) => ({ key: k, val: v }))
  } catch { /* */ }
  const parsed = parseUrl(entry.url)

  return (
    <div className="url-tooltip" style={{ left: x, top: y }}>
      <div style={{ marginBottom: queryParams.length ? 6 : 0 }}>
        <span className="url-tooltip-host">{parsed.host}</span>
        <span className="url-tooltip-path">{parsed.path}</span>
      </div>
      {queryParams.length > 0 && (
        <div className="url-tooltip-query">
          {queryParams.slice(0, 15).map((p, i) => (
            <div key={i}><span style={{ color: 'var(--accent)' }}>{decodeURIComponent(p.key)}</span><span style={{ color: 'var(--text-3)' }}> = </span><span style={{ color: 'var(--green)' }}>{decodeURIComponent(p.val).slice(0, 80)}</span></div>
          ))}
          {queryParams.length > 15 && <div style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>…and {queryParams.length - 15} more</div>}
        </div>
      )}
      <div className="url-tooltip-actions">
        <button onClick={() => { navigator.clipboard.writeText(entry.url); showToast('Copied URL') }}>Copy URL</button>
        {queryParams.length > 0 && <button onClick={() => { navigator.clipboard.writeText(queryParams.map((p) => `${decodeURIComponent(p.key)}=${decodeURIComponent(p.val)}`).join('\n')); showToast('Copied params') }}>Copy params</button>}
      </div>
    </div>
  )
}

function WaterfallCell({ entry, wfRange, waterfallStart }: { entry: ParsedEntry; wfRange: number; waterfallStart: number }) {
  if (entry.time <= 0 || wfRange <= 0) {
    return <div className="waterfall-cell"><div className="wf-bar-wrap" /></div>
  }

  const offset = ((entry.startTime - waterfallStart) / wfRange) * 100
  const width = Math.max(0.5, (entry.time / wfRange) * 100)
  const t = entry.timings
  const parts = [
    { cls: 'blocked', val: t.blocked },
    { cls: 'dns', val: t.dns },
    { cls: 'connect', val: t.connect },
    { cls: 'ssl', val: t.ssl },
    { cls: 'send', val: t.send },
    { cls: 'wait', val: t.wait },
    { cls: 'receive', val: t.receive },
  ]
  const totalT = parts.reduce((s, p) => s + Math.max(0, p.val || 0), 0) || entry.time
  let pos = offset

  return (
    <div className="waterfall-cell">
      <div className="wf-bar-wrap">
        {parts.map((p, i) => {
          if (!p.val || p.val <= 0) return null
          const w = (p.val / totalT) * width
          const left = pos
          pos += w
          return (
            <div
              key={i}
              className={`wf-bar ${p.cls}`}
              style={{ left: `${left}%`, width: `${Math.max(0.3, w)}%` }}
              title={`${p.cls}: ${formatTime(p.val)}`}
            />
          )
        })}
      </div>
    </div>
  )
}
