import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useHarStore } from '../store/harStore'
import type { VisibleColumns } from '../utils/types'

const COLUMN_LABELS: Record<keyof VisibleColumns, string> = {
  method: 'Method',
  url: 'URL',
  status: 'Status',
  type: 'Type',
  size: 'Size',
  time: 'Time',
  waterfall: 'Waterfall',
}

export function ColumnToggle() {
  const visibleColumns = useHarStore((s) => s.visibleColumns)
  const toggleColumn = useHarStore((s) => s.toggleColumn)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const toggle = useCallback(() => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setOpen((o) => !o)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <>
      <button ref={btnRef} className="tool-btn" onClick={toggle} title="Toggle columns">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      </button>
      {open && createPortal(
        <div
          ref={dropRef}
          className="col-dropdown"
          style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}
        >
          {(Object.keys(COLUMN_LABELS) as (keyof VisibleColumns)[]).map((col) => (
            <label key={col} className="col-item">
              <input
                type="checkbox"
                checked={visibleColumns[col]}
                onChange={() => toggleColumn(col)}
              />
              {COLUMN_LABELS[col]}
            </label>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
