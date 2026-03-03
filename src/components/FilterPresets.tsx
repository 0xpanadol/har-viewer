import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useHarStore } from '../store/harStore'

export function FilterPresets() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [newName, setNewName] = useState('')
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const presets = useHarStore((s) => s.filterPresets)
  const saveFilterPreset = useHarStore((s) => s.saveFilterPreset)
  const deleteFilterPreset = useHarStore((s) => s.deleteFilterPreset)
  const applyFilterPreset = useHarStore((s) => s.applyFilterPreset)

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

  const handleSave = () => {
    if (newName.trim()) {
      saveFilterPreset(newName.trim())
      setNewName('')
    }
  }

  return (
    <>
      <button ref={btnRef} className="pill" onClick={toggle} title="Saved filter presets">
        ⚡ Presets {presets.length > 0 && <span className="count">{presets.length}</span>}
      </button>
      {open && createPortal(
        <div
          ref={dropRef}
          className="domain-dropdown"
          style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: 240, zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', gap: 4, padding: '4px 8px' }}>
            <input
              type="text"
              placeholder="Preset name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              style={{ flex: 1, height: 26, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 4, padding: '0 6px', color: 'var(--text-0)', fontFamily: 'var(--mono)', fontSize: 11 }}
            />
            <button className="tool-btn" onClick={handleSave} style={{ fontSize: 11 }}>Save</button>
          </div>
          {presets.length === 0 && (
            <div style={{ padding: '8px', textAlign: 'center', color: 'var(--text-3)', fontSize: 11 }}>No saved presets</div>
          )}
          {presets.map((p) => (
            <div key={p.id} className="domain-item" style={{ justifyContent: 'space-between' }}>
              <span className="domain-name" style={{ cursor: 'pointer', flex: 1 }} onClick={() => { applyFilterPreset(p); setOpen(false) }} title={`Search: ${p.searchQuery || '(none)'}, Methods: ${p.activeMethodFilters.join(',') || 'all'}`}>
                {p.name}
              </span>
              <button onClick={(e) => { e.stopPropagation(); deleteFilterPreset(p.id) }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12, padding: '0 4px' }} title="Delete preset">✕</button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
