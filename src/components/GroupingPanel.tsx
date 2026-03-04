import { useMemo, useState } from 'react'
import { useHarStore } from '../store/harStore'
import { formatBytes, formatTime } from '../utils/formatters'
import { ResizableOverlay } from './ResizableOverlay'
import type { GroupBy, ParsedEntry } from '../utils/types'

export function GroupingPanel() {
  const allEntries = useHarStore((s) => s.allEntries)
  const setOverlayPanel = useHarStore((s) => s.setOverlayPanel)
  const [groupBy, setGroupBy] = useState<GroupBy>('domain')

  const groups = useMemo(() => {
    const map: Record<string, ParsedEntry[]> = {}
    allEntries.forEach((e) => {
      let key: string
      switch (groupBy) {
        case 'domain': key = e.host; break
        case 'type': key = e.contentType; break
        case 'status': key = Math.floor(e.status / 100) + 'xx'; break
      }
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return Object.entries(map)
      .map(([key, entries]) => ({
        key,
        count: entries.length,
        totalSize: entries.reduce((s, e) => s + Math.max(0, e.size), 0),
        totalTime: entries.reduce((s, e) => s + Math.max(0, e.time), 0),
        avgTime: entries.reduce((s, e) => s + Math.max(0, e.time), 0) / entries.length,
        errors: entries.filter((e) => e.status >= 400).length,
      }))
      .sort((a, b) => b.count - a.count)
  }, [allEntries, groupBy])

  return (
    <ResizableOverlay initialWidth={420}>
      <div className="overlay-header">
        <span className="overlay-title">Request Grouping</span>
        <button className="detail-close" onClick={() => setOverlayPanel('none')}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
        {(['domain', 'type', 'status'] as GroupBy[]).map((g) => (
          <button
            key={g}
            className={`pill ${groupBy === g ? 'active' : ''}`}
            onClick={() => setGroupBy(g)}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="overlay-body">
        <table className="kv-table">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td className="kv-key" style={{ fontWeight: 700 }}>{groupBy}</td>
              <td className="kv-val" style={{ fontWeight: 700, fontSize: 10 }}>Count</td>
              <td className="kv-val" style={{ fontWeight: 700, fontSize: 10 }}>Size</td>
              <td className="kv-val" style={{ fontWeight: 700, fontSize: 10 }}>Avg Time</td>
              <td className="kv-val" style={{ fontWeight: 700, fontSize: 10 }}>Errors</td>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.key}>
                <td className="kv-key" title={g.key}>{g.key}</td>
                <td className="kv-val">{g.count}</td>
                <td className="kv-val">{formatBytes(g.totalSize)}</td>
                <td className="kv-val">{formatTime(g.avgTime)}</td>
                <td className="kv-val" style={{ color: g.errors > 0 ? 'var(--red)' : 'var(--text-2)' }}>
                  {g.errors || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ResizableOverlay>
  )
}
