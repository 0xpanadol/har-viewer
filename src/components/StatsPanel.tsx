import { useMemo } from 'react'
import { useHarStore } from '../store/harStore'
import { formatBytes, formatTime } from '../utils/formatters'

export function StatsPanel() {
  const allEntries = useHarStore((s) => s.allEntries)
  const setOverlayPanel = useHarStore((s) => s.setOverlayPanel)

  const stats = useMemo(() => {
    const byDomain: Record<string, { count: number; size: number; time: number }> = {}
    const byType: Record<string, { count: number; size: number }> = {}
    const byStatus: Record<string, number> = {}
    let totalSize = 0
    let totalTime = 0
    let slowest = allEntries[0]
    let largest = allEntries[0]

    allEntries.forEach((e) => {
      // Domain stats
      if (!byDomain[e.host]) byDomain[e.host] = { count: 0, size: 0, time: 0 }
      byDomain[e.host].count++
      byDomain[e.host].size += Math.max(0, e.size)
      byDomain[e.host].time += Math.max(0, e.time)

      // Type stats
      if (!byType[e.contentType]) byType[e.contentType] = { count: 0, size: 0 }
      byType[e.contentType].count++
      byType[e.contentType].size += Math.max(0, e.size)

      // Status stats
      const sg = Math.floor(e.status / 100) + 'xx'
      byStatus[sg] = (byStatus[sg] || 0) + 1

      totalSize += Math.max(0, e.size)
      totalTime += Math.max(0, e.time)

      if (slowest && e.time > slowest.time) slowest = e
      if (largest && e.size > largest.size) largest = e
    })

    const domainsSorted = Object.entries(byDomain).sort((a, b) => b[1].count - a[1].count)
    const typesSorted = Object.entries(byType).sort((a, b) => b[1].size - a[1].size)

    return { byDomain: domainsSorted, byType: typesSorted, byStatus, totalSize, totalTime, slowest, largest }
  }, [allEntries])

  return (
    <div className="overlay-panel">
      <div className="overlay-header">
        <span className="overlay-title">Statistics</span>
        <button className="detail-close" onClick={() => setOverlayPanel('none')}>✕</button>
      </div>
      <div className="overlay-body">
        <div className="section">
          <div className="section-title">Overview</div>
          <table className="kv-table">
            <tbody>
              <tr><td className="kv-key">Total Requests</td><td className="kv-val">{allEntries.length}</td></tr>
              <tr><td className="kv-key">Total Size</td><td className="kv-val">{formatBytes(stats.totalSize)}</td></tr>
              <tr><td className="kv-key">Total Time</td><td className="kv-val">{formatTime(stats.totalTime)}</td></tr>
              <tr><td className="kv-key">Domains</td><td className="kv-val">{stats.byDomain.length}</td></tr>
              {stats.slowest && <tr><td className="kv-key">Slowest</td><td className="kv-val" style={{ fontSize: 10 }}>{formatTime(stats.slowest.time)} — {stats.slowest.url.slice(0, 80)}</td></tr>}
              {stats.largest && <tr><td className="kv-key">Largest</td><td className="kv-val" style={{ fontSize: 10 }}>{formatBytes(stats.largest.size)} — {stats.largest.url.slice(0, 80)}</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="section">
          <div className="section-title">Status Codes</div>
          <div className="stats-bar-group">
            {Object.entries(stats.byStatus).sort().map(([sg, count]) => (
              <div key={sg} className="stats-bar-row">
                <span className={`stats-label status-${sg}`}>{sg}</span>
                <div className="stats-bar-track">
                  <div className={`stats-bar status-bar-${sg}`} style={{ width: `${(count / allEntries.length) * 100}%` }} />
                </div>
                <span className="stats-val">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-title">By Domain</div>
          <table className="kv-table">
            <tbody>
              {stats.byDomain.slice(0, 20).map(([domain, d]) => (
                <tr key={domain}>
                  <td className="kv-key" title={domain}>{domain}</td>
                  <td className="kv-val">{d.count} req · {formatBytes(d.size)} · avg {formatTime(d.time / d.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section">
          <div className="section-title">By Content Type</div>
          <table className="kv-table">
            <tbody>
              {stats.byType.map(([type, d]) => (
                <tr key={type}>
                  <td className="kv-key">{type}</td>
                  <td className="kv-val">{d.count} req · {formatBytes(d.size)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
