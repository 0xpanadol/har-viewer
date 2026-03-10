import { useRef, useMemo } from 'react'
import { useHarStore } from '../store/harStore'
import { formatBytes, formatTime, timeClass } from '../utils/formatters'
import { parseHarEntries } from '../utils/parsers'
import { ResizableOverlay } from './ResizableOverlay'
import { Section } from './Section'
import type { HarLog, ParsedEntry } from '../utils/types'

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
    <ResizableOverlay initialWidth={600} minWidth={400} className="diff-panel">
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

            {/* URL-level diff */}
            <UrlDiff entriesA={allEntries} entriesB={compareEntries!} />
          </>
        )}
      </div>
    </ResizableOverlay>
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

function UrlDiff({ entriesA, entriesB }: { entriesA: ParsedEntry[]; entriesB: ParsedEntry[] }) {
  const diff = useMemo(() => {
    const mapA = new Map<string, ParsedEntry[]>()
    const mapB = new Map<string, ParsedEntry[]>()
    entriesA.forEach((e) => {
      const key = `${e.method} ${e.path.split('?')[0]}`
      mapA.set(key, [...(mapA.get(key) || []), e])
    })
    entriesB.forEach((e) => {
      const key = `${e.method} ${e.path.split('?')[0]}`
      mapB.set(key, [...(mapB.get(key) || []), e])
    })

    const added: ParsedEntry[] = []
    const removed: ParsedEntry[] = []
    const changed: { key: string; a: ParsedEntry; b: ParsedEntry; timeDelta: number; sizeDelta: number }[] = []

    mapB.forEach((bEntries, key) => {
      if (!mapA.has(key)) bEntries.forEach((e) => added.push(e))
      else {
        const aEntry = mapA.get(key)![0]
        const bEntry = bEntries[0]
        const timeDelta = bEntry.time - aEntry.time
        const sizeDelta = bEntry.size - aEntry.size
        if (Math.abs(timeDelta) > 50 || Math.abs(sizeDelta) > 500) {
          changed.push({ key, a: aEntry, b: bEntry, timeDelta, sizeDelta })
        }
      }
    })
    mapA.forEach((aEntries, key) => {
      if (!mapB.has(key)) aEntries.forEach((e) => removed.push(e))
    })

    changed.sort((a, b) => Math.abs(b.timeDelta) - Math.abs(a.timeDelta))
    return { added, removed, changed }
  }, [entriesA, entriesB])

  return (
    <>
      <Section title={`New Requests`} badge={diff.added.length} defaultOpen={diff.added.length > 0 && diff.added.length <= 20}>
        {diff.added.length === 0 && <div className="issues-empty">No new requests</div>}
        {diff.added.slice(0, 30).map((e, i) => (
          <div key={i} className="issue-row" style={{ cursor: 'default' }}>
            <span style={{ color: 'var(--green)', fontSize: 10, width: 16, flexShrink: 0 }}>+</span>
            <span className="issue-method">{e.method}</span>
            <span className="issue-url">{e.path.split('?')[0].slice(0, 80)}</span>
            <span className={`issue-time ${timeClass(e.time)}`}>{formatTime(e.time)}</span>
          </div>
        ))}
      </Section>

      <Section title={`Removed Requests`} badge={diff.removed.length} defaultOpen={diff.removed.length > 0 && diff.removed.length <= 20}>
        {diff.removed.length === 0 && <div className="issues-empty">No removed requests</div>}
        {diff.removed.slice(0, 30).map((e, i) => (
          <div key={i} className="issue-row" style={{ cursor: 'default' }}>
            <span style={{ color: 'var(--red)', fontSize: 10, width: 16, flexShrink: 0 }}>−</span>
            <span className="issue-method">{e.method}</span>
            <span className="issue-url">{e.path.split('?')[0].slice(0, 80)}</span>
            <span className={`issue-time ${timeClass(e.time)}`}>{formatTime(e.time)}</span>
          </div>
        ))}
      </Section>

      <Section title={`Changed Requests`} badge={diff.changed.length} defaultOpen={diff.changed.length > 0}>
        {diff.changed.length === 0 && <div className="issues-empty">No significant changes</div>}
        {diff.changed.slice(0, 30).map((c, i) => (
          <div key={i} className="issue-row" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <div style={{ display: 'flex', gap: 6, width: '100%' }}>
              <span className="issue-method">{c.key.split(' ')[0]}</span>
              <span className="issue-url">{c.key.split(' ').slice(1).join(' ').slice(0, 80)}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 10, fontFamily: 'var(--mono)', paddingLeft: 4 }}>
              {c.timeDelta !== 0 && (
                <span style={{ color: c.timeDelta > 0 ? 'var(--red)' : 'var(--green)' }}>
                  Time: {c.timeDelta > 0 ? '+' : ''}{formatTime(c.timeDelta)}
                </span>
              )}
              {c.sizeDelta !== 0 && (
                <span style={{ color: c.sizeDelta > 0 ? 'var(--orange)' : 'var(--green)' }}>
                  Size: {c.sizeDelta > 0 ? '+' : ''}{formatBytes(Math.abs(c.sizeDelta))}
                </span>
              )}
            </div>
          </div>
        ))}
      </Section>
    </>
  )
}
