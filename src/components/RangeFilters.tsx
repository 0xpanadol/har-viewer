import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useHarStore } from '../store/harStore'

export function RangeFilters() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const minTime = useHarStore((s) => s.minTime)
  const maxTime = useHarStore((s) => s.maxTime)
  const minSize = useHarStore((s) => s.minSize)
  const maxSize = useHarStore((s) => s.maxSize)
  const setMinTime = useHarStore((s) => s.setMinTime)
  const setMaxTime = useHarStore((s) => s.setMaxTime)
  const setMinSize = useHarStore((s) => s.setMinSize)
  const setMaxSize = useHarStore((s) => s.setMaxSize)

  const hasRange = minTime !== null || maxTime !== null || minSize !== null || maxSize !== null

  const parseSize = (v: string): number | null => {
    if (!v.trim()) return null
    const n = parseFloat(v)
    if (isNaN(n)) return null
    const lower = v.toLowerCase()
    if (lower.endsWith('mb')) return n * 1024 * 1024
    if (lower.endsWith('kb')) return n * 1024
    return n
  }

  const toggle = useCallback(() => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left })
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

  const inputStyle: React.CSSProperties = {
    width: '50%', height: 26, background: 'var(--bg-1)',
    border: '1px solid var(--border)', borderRadius: 4,
    padding: '0 6px', color: 'var(--text-0)',
    fontFamily: 'var(--mono)', fontSize: 11,
  }

  return (
    <>
      <button
        ref={btnRef}
        className={`pill ${hasRange ? 'active' : ''}`}
        onClick={toggle}
        title="Time/Size range filters"
      >
        ⇅ Range {hasRange && '●'}
      </button>
      {open && createPortal(
        <div
          ref={dropRef}
          className="domain-dropdown"
          style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: 260, zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '4px 8px', fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>Time (ms)</div>
          <div style={{ display: 'flex', gap: 6, padding: '4px 8px' }}>
            <input type="number" placeholder="Min" value={minTime ?? ''} onChange={(e) => setMinTime(e.target.value ? Number(e.target.value) : null)} style={inputStyle} />
            <input type="number" placeholder="Max" value={maxTime ?? ''} onChange={(e) => setMaxTime(e.target.value ? Number(e.target.value) : null)} style={inputStyle} />
          </div>
          <div style={{ padding: '4px 8px', fontSize: 11, color: 'var(--text-2)', fontWeight: 600, marginTop: 4 }}>Size (bytes, or use KB/MB)</div>
          <div style={{ display: 'flex', gap: 6, padding: '4px 8px' }}>
            <input type="text" placeholder="Min" defaultValue={minSize !== null ? String(minSize) : ''} onBlur={(e) => setMinSize(parseSize(e.target.value))} onKeyDown={(e) => { if (e.key === 'Enter') setMinSize(parseSize((e.target as HTMLInputElement).value)) }} style={inputStyle} />
            <input type="text" placeholder="Max" defaultValue={maxSize !== null ? String(maxSize) : ''} onBlur={(e) => setMaxSize(parseSize(e.target.value))} onKeyDown={(e) => { if (e.key === 'Enter') setMaxSize(parseSize((e.target as HTMLInputElement).value)) }} style={inputStyle} />
          </div>
          {hasRange && (
            <div style={{ padding: '6px 8px' }}>
              <button className="tool-btn" onClick={() => { setMinTime(null); setMaxTime(null); setMinSize(null); setMaxSize(null) }} style={{ fontSize: 11, width: '100%', justifyContent: 'center' }}>Clear ranges</button>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
