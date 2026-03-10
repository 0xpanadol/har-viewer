import { useMemo, useRef, useState, useCallback } from 'react'
import { useHarStore } from '../store/harStore'
import { useFilteredEntries } from '../hooks/useFilteredEntries'
import { formatTime, formatBytes, statusClass } from '../utils/formatters'
import { ResizableOverlay } from './ResizableOverlay'

const ROW_H = 24
const LABEL_W = 260
const PHASES = [
  { key: 'blocked' as const, label: 'Blocked', color: '#888' },
  { key: 'dns' as const, label: 'DNS', color: 'var(--cyan)' },
  { key: 'connect' as const, label: 'Connect', color: 'var(--orange)' },
  { key: 'ssl' as const, label: 'SSL/TLS', color: 'var(--accent)' },
  { key: 'send' as const, label: 'Send', color: 'var(--green)' },
  { key: 'wait' as const, label: 'Wait (TTFB)', color: 'var(--blue)' },
  { key: 'receive' as const, label: 'Receive', color: 'var(--yellow)' },
]

export function WaterfallChart() {
  const setOverlayPanel = useHarStore((s) => s.setOverlayPanel)
  const setSelectedIdx = useHarStore((s) => s.setSelectedIdx)
  const setDetailPanelOpen = useHarStore((s) => s.setDetailPanelOpen)
  const setActiveDetailTab = useHarStore((s) => s.setActiveDetailTab)
  const waterfallStart = useHarStore((s) => s.waterfallStart)
  const waterfallEnd = useHarStore((s) => s.waterfallEnd)
  const { entries } = useFilteredEntries()
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; entry: typeof entries[0] } | null>(null)

  const range = waterfallEnd - waterfallStart || 1

  // Time axis ticks
  const ticks = useMemo(() => {
    const count = 8
    const result: { pct: number; label: string }[] = []
    for (let i = 0; i <= count; i++) {
      const pct = (i / count) * 100
      const ms = (i / count) * range
      result.push({ pct, label: formatTime(ms) })
    }
    return result
  }, [range])

  const handleRowClick = useCallback((idx: number) => {
    setSelectedIdx(idx)
    setDetailPanelOpen(true)
    setActiveDetailTab('timing')
  }, [setSelectedIdx, setDetailPanelOpen, setActiveDetailTab])

  const handleMouseEnter = useCallback((e: React.MouseEvent, entry: typeof entries[0]) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltip({ x: rect.right + 8, y: rect.top, entry })
  }, [])

  const handleMouseLeave = useCallback(() => setTooltip(null), [])

  return (
    <ResizableOverlay initialWidth={800}>
      <div className="overlay-header">
        <span className="overlay-title">Waterfall Chart</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>{entries.length} requests · {formatTime(range)} total</span>
        <button className="detail-close" onClick={() => setOverlayPanel('none')}>✕</button>
      </div>
      <div className="wfc-legend">
        {PHASES.map((p) => (
          <div key={p.key} className="wfc-legend-item">
            <span className="wfc-legend-swatch" style={{ background: p.color }} />
            {p.label}
          </div>
        ))}
      </div>
      <div className="wfc-container" ref={containerRef}>
        {/* Time axis */}
        <div className="wfc-axis" style={{ paddingLeft: LABEL_W }}>
          {ticks.map((t, i) => (
            <div key={i} className="wfc-tick" style={{ left: `${t.pct}%` }}>
              <span className="wfc-tick-label">{t.label}</span>
            </div>
          ))}
        </div>
        {/* Rows */}
        <div className="wfc-rows">
          {entries.map((entry) => {
            const offset = ((entry.startTime - waterfallStart) / range) * 100
            const t = entry.timings
            const parts = PHASES.map((p) => ({ ...p, val: Math.max(0, t[p.key] || 0) }))
            const totalT = parts.reduce((s, p) => s + p.val, 0) || entry.time || 1
            let pos = offset

            return (
              <div
                key={entry._idx}
                className="wfc-row"
                style={{ height: ROW_H }}
                onClick={() => handleRowClick(entry._idx)}
                onMouseEnter={(e) => handleMouseEnter(e, entry)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="wfc-label" style={{ width: LABEL_W }}>
                  <span className={`wfc-status ${statusClass(entry.status)}`}>{entry.status}</span>
                  <span className="wfc-method">{entry.method}</span>
                  <span className="wfc-url" title={entry.url}>{entry.path.split('?')[0].split('/').pop() || entry.path}</span>
                </div>
                <div className="wfc-bars" style={{ marginLeft: LABEL_W }}>
                  {parts.map((p, i) => {
                    if (p.val <= 0) return null
                    const w = (p.val / range) * 100
                    const left = pos
                    pos += w
                    return (
                      <div
                        key={i}
                        className="wfc-bar"
                        style={{ left: `${left}%`, width: `${Math.max(0.2, w)}%`, background: p.color }}
                        title={`${p.label}: ${formatTime(p.val)}`}
                      />
                    )
                  })}
                  {/* Total time label */}
                  <span className="wfc-time-label" style={{ left: `${pos + 0.3}%` }}>
                    {formatTime(entry.time)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {/* Tooltip */}
      {tooltip && (
        <div className="wfc-tooltip" style={{ top: Math.min(tooltip.y, window.innerHeight - 160), left: Math.min(tooltip.x, window.innerWidth - 280) }}>
          <div className="wfc-tt-url">{tooltip.entry.url.slice(0, 100)}</div>
          <div className="wfc-tt-row"><span>Status:</span> <span className={statusClass(tooltip.entry.status)}>{tooltip.entry.status} {tooltip.entry.statusText}</span></div>
          <div className="wfc-tt-row"><span>Size:</span> {formatBytes(tooltip.entry.size)}</div>
          <div className="wfc-tt-row"><span>Time:</span> {formatTime(tooltip.entry.time)}</div>
          {PHASES.map((p) => {
            const val = tooltip.entry.timings[p.key]
            if (!val || val <= 0) return null
            return <div key={p.key} className="wfc-tt-row"><span style={{ color: p.color }}>● {p.label}:</span> {formatTime(val)}</div>
          })}
        </div>
      )}
    </ResizableOverlay>
  )
}
