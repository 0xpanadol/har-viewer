import { useMemo } from 'react'
import { useHarStore } from '../store/harStore'
import { formatBytes, formatTime } from '../utils/formatters'

export function PerformancePanel() {
  const allEntries = useHarStore((s) => s.allEntries)
  const setOverlayPanel = useHarStore((s) => s.setOverlayPanel)

  const perf = useMemo(() => {
    let cached = 0
    let fresh = 0
    let redirectChains = 0
    let corsPreflight = 0
    let compressed = 0
    let uncompressed = 0
    let totalTransferred = 0
    let totalUncompressed = 0
    const redirectMap = new Map<string, number>()

    allEntries.forEach((e) => {
      const raw = e._raw
      // Cache analysis
      if (e.status === 304) cached++
      else if (e.status >= 200 && e.status < 400) fresh++

      // Redirect chains
      if (e.status >= 300 && e.status < 400 && raw.response?.redirectURL) {
        const target = raw.response.redirectURL
        redirectMap.set(e.url, (redirectMap.get(e.url) || 0) + 1)
        redirectMap.set(target, (redirectMap.get(target) || 0) + 1)
      }

      // CORS preflight
      if (e.method === 'OPTIONS') corsPreflight++

      // Compression
      const ce = (raw.response?.headers || []).find(
        (h) => h.name.toLowerCase() === 'content-encoding'
      )
      if (ce && ce.value) {
        compressed++
        const contentSize = raw.response?.content?.size || 0
        const bodySize = raw.response?.bodySize || 0
        if (bodySize > 0) totalTransferred += bodySize
        if (contentSize > 0) totalUncompressed += contentSize
      } else {
        uncompressed++
        const size = Math.max(0, e.size)
        totalTransferred += size
        totalUncompressed += size
      }
    })

    // Count redirect chains (sequences of 3+ redirects)
    redirectMap.forEach((count) => { if (count >= 2) redirectChains++ })

    const cacheRatio = (cached + fresh) > 0 ? (cached / (cached + fresh)) * 100 : 0
    const compressionRatio = totalUncompressed > 0 ? ((1 - totalTransferred / totalUncompressed) * 100) : 0

    // HTTP version breakdown
    const httpVersions: Record<string, number> = {}
    allEntries.forEach((e) => {
      const v = e._raw.request?.httpVersion || 'unknown'
      httpVersions[v] = (httpVersions[v] || 0) + 1
    })

    // Connection reuse
    const connections = new Set(allEntries.map((e) => e._raw.connection).filter(Boolean))

    return {
      cached, fresh, cacheRatio,
      redirectChains, corsPreflight,
      compressed, uncompressed, compressionRatio,
      totalTransferred, totalUncompressed,
      httpVersions, connectionCount: connections.size,
    }
  }, [allEntries])

  return (
    <div className="overlay-panel">
      <div className="overlay-header">
        <span className="overlay-title">Performance Insights</span>
        <button className="detail-close" onClick={() => setOverlayPanel('none')}>✕</button>
      </div>
      <div className="overlay-body">
        <div className="section">
          <div className="section-title">Cache Analysis</div>
          <table className="kv-table">
            <tbody>
              <tr><td className="kv-key">304 (Cached)</td><td className="kv-val">{perf.cached}</td></tr>
              <tr><td className="kv-key">Fresh (200-399)</td><td className="kv-val">{perf.fresh}</td></tr>
              <tr><td className="kv-key">Cache Hit Ratio</td><td className="kv-val">{perf.cacheRatio.toFixed(1)}%</td></tr>
            </tbody>
          </table>
          <div className="stats-bar-row" style={{ marginTop: 8 }}>
            <span className="stats-label" style={{ color: 'var(--green)' }}>Hit</span>
            <div className="stats-bar-track">
              <div className="stats-bar" style={{ width: `${perf.cacheRatio}%`, background: 'var(--green)' }} />
            </div>
            <span className="stats-val">{perf.cacheRatio.toFixed(0)}%</span>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Compression</div>
          <table className="kv-table">
            <tbody>
              <tr><td className="kv-key">Compressed</td><td className="kv-val">{perf.compressed} requests</td></tr>
              <tr><td className="kv-key">Uncompressed</td><td className="kv-val">{perf.uncompressed} requests</td></tr>
              <tr><td className="kv-key">Transferred</td><td className="kv-val">{formatBytes(perf.totalTransferred)}</td></tr>
              <tr><td className="kv-key">Uncompressed Size</td><td className="kv-val">{formatBytes(perf.totalUncompressed)}</td></tr>
              <tr><td className="kv-key">Savings</td><td className="kv-val">{perf.compressionRatio.toFixed(1)}%</td></tr>
            </tbody>
          </table>
        </div>

        <div className="section">
          <div className="section-title">Network</div>
          <table className="kv-table">
            <tbody>
              <tr><td className="kv-key">CORS Preflight</td><td className="kv-val">{perf.corsPreflight} OPTIONS requests</td></tr>
              <tr><td className="kv-key">Redirect Chains</td><td className="kv-val">{perf.redirectChains}</td></tr>
              <tr><td className="kv-key">Connections</td><td className="kv-val">{perf.connectionCount || '—'}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="section">
          <div className="section-title">HTTP Versions</div>
          <div className="stats-bar-group">
            {Object.entries(perf.httpVersions).sort().map(([v, count]) => (
              <div key={v} className="stats-bar-row">
                <span className="stats-label" style={{ width: 60 }}>{v}</span>
                <div className="stats-bar-track">
                  <div className="stats-bar" style={{ width: `${(count / allEntries.length) * 100}%`, background: 'var(--accent)' }} />
                </div>
                <span className="stats-val">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-title">Timing Breakdown (avg)</div>
          <TimingAvg />
        </div>
      </div>
    </div>
  )
}

function TimingAvg() {
  const allEntries = useHarStore((s) => s.allEntries)
  const avg = useMemo(() => {
    const n = allEntries.length || 1
    const sums = { blocked: 0, dns: 0, connect: 0, ssl: 0, send: 0, wait: 0, receive: 0 }
    allEntries.forEach((e) => {
      const t = e.timings
      if (t.blocked > 0) sums.blocked += t.blocked
      if (t.dns > 0) sums.dns += t.dns
      if (t.connect > 0) sums.connect += t.connect
      if (t.ssl > 0) sums.ssl += t.ssl
      if (t.send > 0) sums.send += t.send
      if (t.wait > 0) sums.wait += t.wait
      if (t.receive > 0) sums.receive += t.receive
    })
    return Object.fromEntries(Object.entries(sums).map(([k, v]) => [k, v / n])) as typeof sums
  }, [allEntries])

  const max = Math.max(...Object.values(avg), 1)
  const colors: Record<string, string> = { blocked: '#888', dns: 'var(--cyan)', connect: 'var(--orange)', ssl: 'var(--accent)', send: 'var(--green)', wait: 'var(--blue)', receive: 'var(--yellow)' }

  return (
    <div className="stats-bar-group">
      {Object.entries(avg).map(([phase, val]) => (
        <div key={phase} className="stats-bar-row">
          <span className="stats-label" style={{ width: 60 }}>{phase}</span>
          <div className="stats-bar-track">
            <div className="stats-bar" style={{ width: `${(val / max) * 100}%`, background: colors[phase] || 'var(--text-2)' }} />
          </div>
          <span className="stats-val">{formatTime(val)}</span>
        </div>
      ))}
    </div>
  )
}
