import { useState, useRef, useEffect } from 'react'
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
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="col-toggle-wrap" ref={ref}>
      <button className="tool-btn" onClick={() => setOpen(!open)} title="Toggle columns">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      </button>
      {open && (
        <div className="col-dropdown">
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
        </div>
      )}
    </div>
  )
}
