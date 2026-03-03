import { useRef, useMemo } from 'react'
import { useHarStore } from '../store/harStore'
import { formatBytes, formatTime } from '../utils/formatters'
import { parseHarEntries } from '../utils/parsers'
import type { HarLog } from '../utils/types'

export function ComparePanel() {
  const setOverlayPanel = useHarStore((s) => s.setOverlayPanel)
  const allEntries = useHarStore((s) => s.allEntries)
  const fileName = useHarStore((s) => s.fileName)
  const compareData = useHarStore((s) => s.compareData)
  const setCompareData = useHarStore((s) => s.setCompareData)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const log: HarLog = data.log || data
      setCompareData({ log, fileName: file.name })
    } catch {
      alert('Failed to parse comparison HAR file')
    }
  }

  const compareEntries = useMemo(() => {
    if (!compareData) return null
    return parseHarEntries(compareData.log.entries || [])
  }, [compareData])

  const statsA = useMemo(() => computeStats(allEntries), [allEntries])
  const statsB = useMemo(() => compareEntries ? computeStats(compareEntries) : null, [compareEntries])

  return (
    <div className="overlay-panel diff-panel" style={{ width: 600 }}>
      <div className="overlay-header">
        <span className="overlay-title">Multi-File Compare</span>
        <button className="detail-close" onClick={() => setOverlayPanel('none')}>✕</button>
      </div>
      <div className="overlay-body">
        <input
          type="file"
          ref={fileRef}
          accept=".har,.json"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); if (fileRef.current) fileRef.current.value = '' }}
        />

        {!compareData && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ color: 'var(--text-2)', marginBottom: 12, fontSize: 12 }}>
              Load a second HAR file to compare with the current one
            </div>
            <button className="tool-btn" onClick={() => fileRef.current?.click()} style={{ margin: '0 auto' }}>
              Load comparison file
            </button>
          </div>
        )}

        {compareData && statsB && (
          <>
            <div className="diff-grid">
              <div className="diff-col">
                <div className="diff-col-title">{fileName || 'Current'}</div>
              </div>
              <div className="diff-col">
                <div className="diff-col-title">{compareData.fileName}</div>
              </div>
            </div>

            <div className="section">
              <div className="section-title">Overview Comparison</div>
              <CompareRow label="Requests" a={statsA.count} b={statsB.count} />
              <CompareRow label="Total Size" a={formatBytes(statsA.totalSize)} b={formatBytes(statsB.totalSize)} numA={statsA.totalSize} numB={statsB.totalSize} />
              <CompareRow label="Total Time" a={formatTime(statsA.totalTime)} b={formatTime(statsB.totalTime)} numA={statsA.totalTime} numB={statsB.totalTime} />
              <CompareRow label="Avg Time" a={formatTime(statsA.avgTime)} b={formatTime(statsB.avgTime)} numA={statsA.avgTime} numB={statsB.avgTime} lowerBetter />
              <CompareRow label="Errors" a={statsA.errors} b={statsB.errors} numA={statsA.errors} numB={statsB.errors} lowerBetter />
              <CompareRow label="Domains" a={statsA.domains} b={statsB.domains} />
            </div>

            <div className="section">
              <div className="section-title">Status Distribution</div>
              <div className="diff-grid">
                <div className="diff-col">
                  {Object.entries(statsA.byStatus).sort().map(([k, v]) => (
                    <div key={k} style={{ fontSize: 11, fontFamily: 'var(--mono)', marginBottom: 2 }}>
                      <span className={`status-${k}`}>{k}</span>: {v}
                    </div>
                  ))}
                </div>
                <div className="diff-col">
                  {Object.entries(statsB.byStatus).sort().map(([k, v]) => (
                    <div key={k} style={{ fontSize: 11, fontFamily: 'var(--mono)', marginBottom: 2 }}>
                      <span className={`status-${k}`}>{k}</span>: {v}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '8px 0' }}>
              <button className="tool-btn" onClick={() => setCompareData(null)} style={{ fontSize: 11 }}>
                Clear comparison
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function computeStats(entries: { status: number; size: number; time: number; host: string }[]) {
  const count = entries.length
  const totalSize = entries.reduce((s, e) => s + Math.max(0, e.size), 0)
  const totalTime = entries.reduce((s, e) => s + Math.max(0, e.time), 0)
  const avgTime = count > 0 ? totalTime / count : 0
  const errors = entries.filter((e) => e.status >= 400).length
  const domains = new Set(entries.map((e) => e.host)).size
  const byStatus: Record<string, number> = {}
  entries.forEach((e) => {
    const sg = Math.floor(e.status / 100) + 'xx'
    byStatus[sg] = (byStatus[sg] || 0) + 1
  })
  return { count, totalSize, totalTime, avgTime, errors, domains, byStatus }
}

function CompareRow({ label, a, b, numA, numB, lowerBetter }: {
  label: string; a: string | number; b: string | number
  numA?: number; numB?: number; lowerBetter?: boolean
}) {
  let color = 'var(--text-0)'
  if (numA !== undefined && numB !== undefined && numA !== numB) {
    const better = lowerBetter ? numB < numA : numB > numA
    color = better ? 'var(--green)' : 'var(--red)'
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--bg-3)', fontSize: 12 }}>
      <span style={{ width: 100, color: 'var(--text-2)', fontWeight: 600, fontSize: 11 }}>{label}</span>
      <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11 }}>{a}</span>
      <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 11, color }}>{b}</span>
    </div>
  )
}
