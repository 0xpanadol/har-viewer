import { useRef, useCallback, useEffect, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useHarStore } from '../store/harStore'
import { useFilteredEntries } from '../hooks/useFilteredEntries'
import { formatBytes, formatTime, timeClass, statusClass } from '../utils/formatters'
import { parseUrl } from '../utils/parsers'
import { ContextMenu } from './ContextMenu'
import type { ParsedEntry, SortColumn } from '../utils/types'

const ROW_H = 32

export function EntryList() {
  const filteredEntries = useFilteredEntries()
  const selectedIdx = useHarStore((s) => s.selectedIdx)
  const setSelectedIdx = useHarStore((s) => s.setSelectedIdx)
  const setDetailPanelOpen = useHarStore((s) => s.setDetailPanelOpen)
  const checkedEntries = useHarStore((s) => s.checkedEntries)
  const toggleCheck = useHarStore((s) => s.toggleCheck)
  const checkAll = useHarStore((s) => s.checkAll)
  const uncheckAll = useHarStore((s) => s.uncheckAll)
  const sortCol = useHarStore((s) => s.sortCol)
  const sortDir = useHarStore((s) => s.sortDir)
  const toggleSort = useHarStore((s) => s.toggleSort)
  const waterfallStart = useHarStore((s) => s.waterfallStart)
  const waterfallEnd = useHarStore((s) => s.waterfallEnd)
  const scrollTop = useHarStore((s) => s.scrollTop)
  const setScrollTop = useHarStore((s) => s.setScrollTop)

  const parentRef = useRef<HTMLDivElement>(null)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; entry: ParsedEntry } | null>(null)
  const scrollRestoredRef = useRef(false)

  const virtualizer = useVirtualizer({
    count: filteredEntries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 15,
  })

  // Restore scroll position on mount
  useEffect(() => {
    if (parentRef.current && scrollTop > 0 && !scrollRestoredRef.current && filteredEntries.length > 0) {
      parentRef.current.scrollTop = scrollTop
      scrollRestoredRef.current = true
    }
  }, [filteredEntries.length])

  // Persist scroll position (debounced)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const handleScroll = useCallback(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => {
      if (parentRef.current) setScrollTop(parentRef.current.scrollTop)
    }, 200)
  }, [setScrollTop])

  const handleSelectEntry = useCallback(
    (idx: number) => {
      setSelectedIdx(idx)
      setDetailPanelOpen(true)
    },
    [setSelectedIdx, setDetailPanelOpen]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, entry: ParsedEntry) => {
      e.preventDefault()
      setCtxMenu({ x: e.clientX, y: e.clientY, entry })
    },
    []
  )

  // Select all checkbox logic
  const allChecked = filteredEntries.length > 0 && filteredEntries.every((e) => checkedEntries.includes(e._idx))
  const someChecked = filteredEntries.some((e) => checkedEntries.includes(e._idx))

  const handleSelectAll = useCallback(() => {
    const indices = filteredEntries.map((e) => e._idx)
    if (allChecked) uncheckAll(indices)
    else checkAll(indices)
  }, [filteredEntries, allChecked, checkAll, uncheckAll])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useHarStore.getState().setDetailPanelOpen(false)
        useHarStore.getState().setSelectedIdx(-1)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!filteredEntries.length) return
        e.preventDefault()
        const state = useHarStore.getState()
        let curIdx = filteredEntries.findIndex((e) => e._idx === state.selectedIdx)
        if (e.key === 'ArrowDown') curIdx = Math.min(filteredEntries.length - 1, curIdx + 1)
        else curIdx = Math.max(0, curIdx - 1)
        if (curIdx < 0) curIdx = 0
        handleSelectEntry(filteredEntries[curIdx]._idx)
        virtualizer.scrollToIndex(curIdx, { align: 'auto' })
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [filteredEntries, handleSelectEntry, virtualizer])

  const wfRange = waterfallEnd - waterfallStart || 1

  const getSortClass = (col: SortColumn) => {
    if (sortCol !== col) return 'sortable'
    return `sortable sorted ${sortDir}`
  }

  return (
    <div id="entry-list-wrap">
      <div id="entry-header">
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
        <div className={getSortClass('method')} onClick={() => toggleSort('method')}>Method</div>
        <div className={getSortClass('url')} onClick={() => toggleSort('url')}>URL</div>
        <div className={getSortClass('status')} onClick={() => toggleSort('status')}>Status</div>
        <div className={getSortClass('type')} onClick={() => toggleSort('type')}>Type</div>
        <div className={getSortClass('size')} onClick={() => toggleSort('size')}>Size</div>
        <div className={getSortClass('time')} onClick={() => toggleSort('time')}>Time</div>
        <div>Waterfall</div>
      </div>

      <div id="entry-scroll" ref={parentRef} onScroll={handleScroll}>
        <div id="entry-container" style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const entry = filteredEntries[virtualRow.index]
            if (!entry) return null
            const isSelected = entry._idx === selectedIdx
            const isChecked = checkedEntries.includes(entry._idx)
            const parsed = parseUrl(entry.url)

            return (
              <div
                key={virtualRow.key}
                className={`entry-row ${isSelected ? 'selected' : ''} ${isChecked ? 'checked' : ''}`}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ROW_H, transform: `translateY(${virtualRow.start}px)` }}
                onClick={() => handleSelectEntry(entry._idx)}
                onContextMenu={(e) => handleContextMenu(e, entry)}
              >
                <div className="entry-check">
                  <input
                    type="checkbox"
                    tabIndex={-1}
                    checked={isChecked}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleCheck(entry._idx)}
                  />
                </div>
                <div className="entry-idx">{entry._idx + 1}</div>
                <div className={`entry-method ${entry.method}`}>{entry.method}</div>
                <div className="entry-url">
                  <span className="host">{parsed.host}</span>
                  <span className="path">{parsed.path.length > 80 ? parsed.path.slice(0, 80) + '…' : parsed.path}</span>
                </div>
                <div className={`entry-status ${statusClass(entry.status)}`}>{entry.status || '—'}</div>
                <div className="entry-type">{entry.contentType}</div>
                <div className="entry-size">{entry.size >= 0 ? formatBytes(entry.size) : '—'}</div>
                <div className={`entry-time ${timeClass(entry.time)}`}>{formatTime(entry.time)}</div>
                <WaterfallCell entry={entry} wfRange={wfRange} waterfallStart={waterfallStart} />
              </div>
            )
          })}
        </div>
      </div>

      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} entry={ctxMenu.entry} onClose={() => setCtxMenu(null)} />
      )}
    </div>
  )
}


// Waterfall cell sub-component
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
