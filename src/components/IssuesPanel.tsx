import { useMemo } from 'react'
import { useHarStore } from '../store/harStore'
import { formatTime, formatBytes, statusClass, timeClass } from '../utils/formatters'
import { ResizableOverlay } from './ResizableOverlay'

const SLOW_THRESHOLD = 2000

export function IssuesPanel() {
  const allEntries = useHarStore((s) => s.allEntries)
  const setOverlayPanel = useHarStore((s) => s.setOverlayPanel)
  const setSelectedIdx = useHarStore((s) => s.setSelectedIdx)
  const setDetailPanelOpen = useHarStore((s) => s.setDetailPanelOpen)

  const { errors, slow, large, duplicates } = useMemo(() => {
    const errors = allEntries.filter((e) => e.status >= 400)
    const slow = allEntries.filter((e) => e.time >= SLOW_THRESHOLD).sort((a, b) => b.time - a.time)
    const large = [...allEntries].sort((a, b) => b.size - a.size).slice(0, 10).filter((e) => e.size > 0)

    // Duplicate detection
    const urlMethodMap: Record<string, number[]> = {}
    allEntries.forEach((e) => {
      const key = `${e.method}:${e.url}`
      if (!urlMethodMap[key]) urlMethodMap[key] = []
      urlMethodMap[key].push(e._idx)
    })
    const duplicates = Object.entries(urlMethodMap)
      .filter(([, indices]) => indices.length > 1)
      .map(([key, indices]) => {
        const [method, ...urlParts] = key.split(':')
        return { method, url: urlParts.join(':'), count: indices.length, indices }
      })
      .sort((a, b) => b.count - a.count)

    return { errors, slow, large, duplicates }
  }, [allEntries])

  const jumpTo = (idx: number) => {
    setSelectedIdx(idx)
    setDetailPanelOpen(true)
  }

  const total = errors.length + slow.length + duplicates.length
  return (
    <ResizableOverlay initialWidth={420}>
      <div className="overlay-header">
        <span className="overlay-title">Issues {total > 0 && <span className="badge issue-badge">{total}</span>}</span>
        <button className="detail-close" onClick={() => setOverlayPanel('none')}>✕</button>
      </div>
      <div className="overlay-body">
        <div className="section">
          <div className="section-title">
            Errors (4xx/5xx) <span className="badge">{errors.length}</span>
          </div>
          {errors.length === 0 && <div className="issues-empty">No errors found</div>}
          {errors.map((e) => (
            <div key={e._idx} className="issue-row" onClick={() => jumpTo(e._idx)}>
              <span className={`issue-status ${statusClass(e.status)}`}>{e.status}</span>
              <span className="issue-method">{e.method}</span>
              <span className="issue-url">{e.url.slice(0, 80)}</span>
            </div>
          ))}
        </div>

        <div className="section">
          <div className="section-title">
            Duplicate Requests <span className="badge">{duplicates.length}</span>
          </div>
          {duplicates.length === 0 && <div className="issues-empty">No duplicates found</div>}
          {duplicates.slice(0, 20).map((d, i) => (
            <div key={i} className="issue-row" onClick={() => jumpTo(d.indices[0])}>
              <span className="issue-status" style={{ color: 'var(--orange)', width: 36 }}>×{d.count}</span>
              <span className="issue-method">{d.method}</span>
              <span className="issue-url">{d.url.slice(0, 80)}</span>
            </div>
          ))}
        </div>

        <div className="section">
          <div className="section-title">
            Slow Requests (&gt;{SLOW_THRESHOLD}ms) <span className="badge">{slow.length}</span>
          </div>
          {slow.length === 0 && <div className="issues-empty">No slow requests</div>}
          {slow.map((e) => (
            <div key={e._idx} className="issue-row" onClick={() => jumpTo(e._idx)}>
              <span className={`issue-time ${timeClass(e.time)}`}>{formatTime(e.time)}</span>
              <span className="issue-method">{e.method}</span>
              <span className="issue-url">{e.url.slice(0, 80)}</span>
            </div>
          ))}
        </div>

        <div className="section">
          <div className="section-title">
            Largest Responses <span className="badge">{large.length}</span>
          </div>
          {large.map((e) => (
            <div key={e._idx} className="issue-row" onClick={() => jumpTo(e._idx)}>
              <span className="issue-size">{formatBytes(e.size)}</span>
              <span className="issue-method">{e.method}</span>
              <span className="issue-url">{e.url.slice(0, 80)}</span>
            </div>
          ))}
        </div>
      </div>
    </ResizableOverlay>
  )
}
