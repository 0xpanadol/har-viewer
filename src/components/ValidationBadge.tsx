import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useHarStore } from '../store/harStore'

export function ValidationBadge() {
  const warnings = useHarStore((s) => s.validationWarnings)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const toggle = useCallback(() => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      // Align to right edge so it doesn't overflow viewport
      setPos({ top: r.bottom + 4, left: Math.max(8, r.right - 300) })
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

  if (warnings.length === 0) return null

  const errors = warnings.filter((w) => w.type === 'error')
  const warns = warnings.filter((w) => w.type === 'warning')

  return (
    <>
      <button
        ref={btnRef}
        className="pill"
        onClick={toggle}
        style={{ borderColor: errors.length > 0 ? 'var(--red)' : 'var(--yellow)', color: errors.length > 0 ? 'var(--red)' : 'var(--yellow)' }}
        title={`${warnings.length} validation issues`}
      >
        ⚠ {warnings.length}
      </button>
      {open && createPortal(
        <div
          ref={dropRef}
          className="domain-dropdown"
          style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: 300, maxHeight: 300, zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>
            HAR Validation ({errors.length} errors, {warns.length} warnings)
          </div>
          {warnings.slice(0, 50).map((w, i) => (
            <div key={i} style={{
              padding: '4px 8px', fontSize: 10, fontFamily: 'var(--mono)',
              color: w.type === 'error' ? 'var(--red)' : 'var(--yellow)',
              borderBottom: '1px solid var(--bg-3)',
            }}>
              {w.idx >= 0 ? `#${w.idx + 1}: ` : ''}{w.message}
            </div>
          ))}
          {warnings.length > 50 && (
            <div style={{ padding: '4px 8px', fontSize: 10, color: 'var(--text-3)' }}>
              ...and {warnings.length - 50} more
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
