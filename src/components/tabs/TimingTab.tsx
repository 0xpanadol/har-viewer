import type { ParsedEntry } from '../../utils/types'
import { formatTime } from '../../utils/formatters'
import { useHarStore } from '../../store/harStore'

interface Props {
  entry: ParsedEntry
}

const PHASES = [
  { key: 'blocked' as const, label: 'Blocked', color: '#888' },
  { key: 'dns' as const, label: 'DNS', color: 'var(--cyan)' },
  { key: 'connect' as const, label: 'Connect', color: 'var(--orange)' },
  { key: 'ssl' as const, label: 'SSL/TLS', color: 'var(--accent)' },
  { key: 'send' as const, label: 'Send', color: 'var(--green)' },
  { key: 'wait' as const, label: 'Wait (TTFB)', color: 'var(--blue)' },
  { key: 'receive' as const, label: 'Receive', color: 'var(--yellow)' },
]

export function TimingTab({ entry }: Props) {
  const waterfallStart = useHarStore((s) => s.waterfallStart)
  const t = entry._raw.timings || {}
  const total = entry.time || 0

  const maxVal = Math.max(
    ...PHASES.map((p) => Math.max(0, t[p.key] || 0)),
    1
  )

  return (
    <>
      <div className="section">
        <div className="section-title">Timing Breakdown</div>
        {PHASES.map((p) => {
          const val = t[p.key]
          if (val === undefined || val < 0) return null
          const pct = (val / maxVal) * 100
          return (
            <div className="timing-row" key={p.key}>
              <div className="timing-label">{p.label}</div>
              <div className="timing-bar-wrap">
                <div
                  className="timing-bar"
                  style={{ width: `${Math.max(1, pct)}%`, background: p.color }}
                >
                  {pct > 15 ? formatTime(val) : ''}
                </div>
              </div>
              <div className="timing-val">{formatTime(val)}</div>
            </div>
          )
        })}
        <div
          className="timing-row"
          style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}
        >
          <div className="timing-label" style={{ fontWeight: 600, color: 'var(--text-0)' }}>Total</div>
          <div className="timing-bar-wrap" />
          <div className="timing-val" style={{ fontWeight: 600, color: 'var(--text-0)' }}>
            {formatTime(total)}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Waterfall Legend</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PHASES.map((p) => (
            <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-2)' }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: p.color }} />
              {p.label}
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">Timeline</div>
        <table className="kv-table">
          <tbody>
            <tr>
              <td className="kv-key">Started</td>
              <td className="kv-val">{entry._raw.startedDateTime || ''}</td>
            </tr>
            <tr>
              <td className="kv-key">Offset</td>
              <td className="kv-val">{formatTime(entry.startTime - waterfallStart)} from first request</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
