import { useMemo, useState, useRef, useEffect } from 'react'
import { useHarStore } from '../store/harStore'

export function DomainFilter() {
  const allEntries = useHarStore((s) => s.allEntries)
  const activeDomainFilters = useHarStore((s) => s.activeDomainFilters)
  const toggleDomainFilter = useHarStore((s) => s.toggleDomainFilter)
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

  const domains = useMemo(() => {
    const map: Record<string, number> = {}
    allEntries.forEach((e) => { map[e.host] = (map[e.host] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [allEntries])

  if (domains.length <= 1) return null

  return (
    <div className="domain-filter-wrap" ref={ref}>
      <button
        className={`tool-btn ${activeDomainFilters.length ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        title="Filter by domain"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
        Domains{activeDomainFilters.length ? ` (${activeDomainFilters.length})` : ''}
      </button>
      {open && (
        <div className="domain-dropdown">
          {domains.map(([domain, count]) => (
            <label key={domain} className="domain-item">
              <input
                type="checkbox"
                checked={activeDomainFilters.includes(domain)}
                onChange={() => toggleDomainFilter(domain)}
              />
              <span className="domain-name">{domain}</span>
              <span className="domain-count">{count}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
