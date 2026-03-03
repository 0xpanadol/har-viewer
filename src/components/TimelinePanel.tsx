import { useMemo, useRef, useState } from 'react'
import { useHarStore } from '../store/harStore'
import { formatTime, formatBytes } from '../utils/formatters'

const LANE_H = 18
const LANE_GAP = 2
const PADDING = 12

export function TimelinePanel() {
  const allEntries = useHarStore((s) => s.allEntries)
  const waterfallStart = useHarStore((s) => s.waterfallStart)
  const waterfallEnd = useHarStore((s) => s.waterfallEnd)
  const setOverlayPanel = useHarStore((s) => s.setOverlayPanel)
  const setSelectedIdx = useHarStore((s) => s.setSelectedIdx)
  const setDetailPanelOpen = useHarStore((s) => s.setDetailPanelOpen)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; entry: typeof allEntries[0] } | null>(null)

  const { lanes, domainColors } = useMemo(() => {
    const byDomain: Record<string, typeof allEntries> = {}
    allEntries.forEach((e) => {
      if (!byDomain[e.host]) byDomain[e.host] = []
      byDomain[e.host].push(e)
    })

    const colors = [
      'var(--accent)', 'var(--green)', 'var(--blue)', 'var(--yellow)',
      'var(--orange)', 'var(--cyan)', 'var(--red)', '#a78bfa', '#f472b6', '#34d399',
    ]
    const domainColors: Record<string, string> = {}
    const sortedDomains = Object.entries(byDomain).sort((a, b) => b[1].length - a[1].length)
    sortedDomains.forEach(([domain], i) => {
      domainColors[domain] = colors[i % colors.length]
    })

    return { lanes: sortedDomains, domainColors }
  }, [allEntries])

  const range = waterfallEnd - waterfallStart || 1
  const totalHeight = lanes.length * (LANE_H + LANE_GAP) + PADDING * 2

  const handleClick = (idx: number) => {
    setSelectedIdx(idx)
    setDetailPanelOpen(true)
  }

  return (
    <div className="overlay-panel" style={{ width: 700 }}>
      <div className="overlay-header">
        <span className="overlay-title">Timeline / Flame Graph</span>
        <button className="detail-close" onClick={() => setOverlayPanel('none')}>✕</button>
      </div>
      <div className="overlay-body" ref={containerRef} style={{ padding: 0, position: 'relative' }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto' }}>
          <svg width="100%" height={totalHeight} style={{ minWidth: 600, display: 'block' }}>
            {/* Time axis */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
              <g key={pct}>
                <line x1={`${pct * 100}%`} y1={0} x2={`${pct * 100}%`} y2={totalHeight} stroke="var(--border)" strokeWidth={0.5} />
                <text x={`${pct * 100}%`} y={10} fill="var(--text-3)" fontSize={9} fontFamily="var(--mono)" textAnchor="middle">
                  {formatTime(range * pct)}
                </text>
              </g>
            ))}

            {lanes.map(([domain, entries], laneIdx) => {
              const y = PADDING + laneIdx * (LANE_H + LANE_GAP)
              return (
                <g key={domain}>
                  {/* Domain label background */}
                  <rect x={0} y={y} width="100%" height={LANE_H} fill="var(--bg-2)" rx={2} opacity={0.3} />
                  {entries.map((e) => {
                    const left = ((e.startTime - waterfallStart) / range) * 100
                    const width = Math.max(0.3, (e.time / range) * 100)
                    return (
                      <rect
                        key={e._idx}
                        x={`${left}%`}
                        y={y + 2}
                        width={`${width}%`}
                        height={LANE_H - 4}
                        fill={domainColors[domain]}
                        opacity={e.status >= 400 ? 1 : 0.7}
                        rx={2}
                        style={{ cursor: 'pointer' }}
                        stroke={e.status >= 400 ? 'var(--red)' : 'none'}
                        strokeWidth={e.status >= 400 ? 1 : 0}
                        onClick={() => handleClick(e._idx)}
                        onMouseEnter={(ev) => {
                          const rect = containerRef.current?.getBoundingClientRect()
                          if (rect) setTooltip({ x: ev.clientX - rect.left, y: ev.clientY - rect.top, entry: e })
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    )
                  })}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Domain legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 12px', borderTop: '1px solid var(--border)', fontSize: 10, fontFamily: 'var(--mono)' }}>
          {lanes.map(([domain]) => (
            <span key={domain} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-1)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: domainColors[domain], display: 'inline-block' }} />
              {domain} ({(allEntries.filter((e) => e.host === domain)).length})
            </span>
          ))}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute', left: tooltip.x + 10, top: tooltip.y - 10,
            background: 'var(--bg-2)', border: '1px solid var(--border-h)', borderRadius: 6,
            padding: '6px 10px', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-0)',
            pointerEvents: 'none', zIndex: 10, maxWidth: 300, boxShadow: '0 4px 16px rgba(0,0,0,.4)',
          }}>
            <div style={{ color: 'var(--accent)', marginBottom: 2 }}>{tooltip.entry.method} {tooltip.entry.status}</div>
            <div style={{ color: 'var(--text-1)', wordBreak: 'break-all' }}>{tooltip.entry.url.slice(0, 100)}</div>
            <div style={{ color: 'var(--text-2)', marginTop: 2 }}>{formatTime(tooltip.entry.time)} · {formatBytes(tooltip.entry.size)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
