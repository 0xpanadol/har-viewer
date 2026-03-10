import { useMemo } from 'react'
import { useHarStore } from '../store/harStore'
import { formatTime, formatBytes, statusClass, timeClass } from '../utils/formatters'
import { ResizableOverlay } from './ResizableOverlay'
import { Section } from './Section'

const SLOW_THRESHOLD = 2000
const SLOW_TTFB = 800
const LARGE_IMAGE_THRESHOLD = 200 * 1024 // 200KB
const LARGE_RESPONSE_THRESHOLD = 1024 * 1024 // 1MB

export function IssuesPanel() {
  const allEntries = useHarStore((s) => s.allEntries)
  const setOverlayPanel = useHarStore((s) => s.setOverlayPanel)
  const setSelectedIdx = useHarStore((s) => s.setSelectedIdx)
  const setDetailPanelOpen = useHarStore((s) => s.setDetailPanelOpen)

  const issues = useMemo(() => {
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

    // Missing cache headers
    const noCache = allEntries.filter((e) => {
      if (e.status >= 400 || e.status === 0 || e.status === 304) return false
      const ct = e.contentType
      if (!['js', 'css', 'img', 'font'].includes(ct)) return false
      const headers = e._raw.response?.headers || []
      const hasCacheControl = headers.some((h) => h.name.toLowerCase() === 'cache-control')
      const hasExpires = headers.some((h) => h.name.toLowerCase() === 'expires')
      const hasEtag = headers.some((h) => h.name.toLowerCase() === 'etag')
      return !hasCacheControl && !hasExpires && !hasEtag
    })

    // Oversized images
    const oversizedImages = allEntries.filter((e) => {
      return e.contentType === 'img' && e.size > LARGE_IMAGE_THRESHOLD
    }).sort((a, b) => b.size - a.size)

    // Render-blocking resources (CSS/JS in head, no async/defer)
    const renderBlocking = allEntries.filter((e) => {
      const ct = e.contentType
      if (ct !== 'js' && ct !== 'css') return false
      // Heuristic: if it's one of the first 20 requests and is JS/CSS, likely render-blocking
      return e._idx < 20 && e.time > 100
    })

    // Redirect chains
    const redirects = allEntries.filter((e) => e.status >= 300 && e.status < 400)
    const redirectChains: { chain: typeof allEntries; length: number }[] = []
    const visited = new Set<number>()
    redirects.forEach((r) => {
      if (visited.has(r._idx)) return
      const chain = [r]
      visited.add(r._idx)
      let redirectUrl = r._raw.response?.redirectURL || ''
      let safety = 0
      while (redirectUrl && safety++ < 10) {
        const next = allEntries.find((e) => e.url === redirectUrl && !visited.has(e._idx))
        if (!next) break
        chain.push(next)
        visited.add(next._idx)
        if (next.status >= 300 && next.status < 400) {
          redirectUrl = next._raw.response?.redirectURL || ''
        } else break
      }
      if (chain.length >= 2) redirectChains.push({ chain, length: chain.length })
    })
    redirectChains.sort((a, b) => b.length - a.length)

    // Mixed content
    const mixedContent = allEntries.filter((e) => {
      if (!e.url.startsWith('http://')) return false
      // Check if any other request is HTTPS (indicating the page is HTTPS)
      return allEntries.some((other) => other.url.startsWith('https://'))
    })

    // Slow TTFB
    const slowTtfb = allEntries.filter((e) => {
      const wait = e.timings?.wait
      return wait !== undefined && wait > SLOW_TTFB
    }).sort((a, b) => (b.timings?.wait || 0) - (a.timings?.wait || 0))

    // Large responses (non-image)
    const largeResponses = allEntries.filter((e) => {
      return e.contentType !== 'img' && e.size > LARGE_RESPONSE_THRESHOLD
    }).sort((a, b) => b.size - a.size)

    const totalIssues = errors.length + slow.length + duplicates.length + noCache.length +
      oversizedImages.length + redirectChains.length + mixedContent.length + slowTtfb.length

    return { errors, slow, large, duplicates, noCache, oversizedImages, renderBlocking, redirectChains, mixedContent, slowTtfb, largeResponses, totalIssues }
  }, [allEntries])

  const jumpTo = (idx: number) => {
    setSelectedIdx(idx)
    setDetailPanelOpen(true)
  }

  return (
    <ResizableOverlay initialWidth={460}>
      <div className="overlay-header">
        <span className="overlay-title">Issues {issues.totalIssues > 0 && <span className="badge issue-badge">{issues.totalIssues}</span>}</span>
        <button className="detail-close" onClick={() => setOverlayPanel('none')}>✕</button>
      </div>
      <div className="overlay-body">
        <Section title={`Errors (4xx/5xx)`} badge={issues.errors.length} defaultOpen>
          {issues.errors.length === 0 && <div className="issues-empty">No errors found</div>}
          {issues.errors.map((e) => (
            <div key={e._idx} className="issue-row" onClick={() => jumpTo(e._idx)}>
              <span className={`issue-status ${statusClass(e.status)}`}>{e.status}</span>
              <span className="issue-method">{e.method}</span>
              <span className="issue-url">{e.url.slice(0, 80)}</span>
            </div>
          ))}
        </Section>

        <Section title={`Slow TTFB (>${SLOW_TTFB}ms)`} badge={issues.slowTtfb.length} defaultOpen={issues.slowTtfb.length > 0}>
          {issues.slowTtfb.length === 0 && <div className="issues-empty">No slow TTFB</div>}
          {issues.slowTtfb.slice(0, 20).map((e) => (
            <div key={e._idx} className="issue-row" onClick={() => jumpTo(e._idx)}>
              <span className="issue-time time-slow">{formatTime(e.timings?.wait || 0)}</span>
              <span className="issue-method">{e.method}</span>
              <span className="issue-url">{e.url.slice(0, 80)}</span>
            </div>
          ))}
        </Section>

        <Section title={`Slow Requests (>${SLOW_THRESHOLD}ms)`} badge={issues.slow.length} defaultOpen={issues.slow.length > 0}>
          {issues.slow.length === 0 && <div className="issues-empty">No slow requests</div>}
          {issues.slow.map((e) => (
            <div key={e._idx} className="issue-row" onClick={() => jumpTo(e._idx)}>
              <span className={`issue-time ${timeClass(e.time)}`}>{formatTime(e.time)}</span>
              <span className="issue-method">{e.method}</span>
              <span className="issue-url">{e.url.slice(0, 80)}</span>
            </div>
          ))}
        </Section>

        <Section title="Missing Cache Headers" badge={issues.noCache.length} defaultOpen={issues.noCache.length > 0}>
          {issues.noCache.length === 0 && <div className="issues-empty">All static assets have cache headers</div>}
          {issues.noCache.slice(0, 20).map((e) => (
            <div key={e._idx} className="issue-row" onClick={() => jumpTo(e._idx)}>
              <span className="issue-status" style={{ color: 'var(--orange)', width: 36 }}>{e.contentType}</span>
              <span className="issue-method">{e.method}</span>
              <span className="issue-url">{e.url.slice(0, 80)}</span>
            </div>
          ))}
        </Section>

        <Section title="Oversized Images (>200KB)" badge={issues.oversizedImages.length} defaultOpen={issues.oversizedImages.length > 0}>
          {issues.oversizedImages.length === 0 && <div className="issues-empty">No oversized images</div>}
          {issues.oversizedImages.slice(0, 20).map((e) => (
            <div key={e._idx} className="issue-row" onClick={() => jumpTo(e._idx)}>
              <span className="issue-size">{formatBytes(e.size)}</span>
              <span className="issue-method">{e.method}</span>
              <span className="issue-url">{e.url.slice(0, 80)}</span>
            </div>
          ))}
        </Section>

        <Section title="Redirect Chains" badge={issues.redirectChains.length} defaultOpen={issues.redirectChains.length > 0}>
          {issues.redirectChains.length === 0 && <div className="issues-empty">No redirect chains</div>}
          {issues.redirectChains.map((rc, i) => (
            <div key={i} style={{ marginBottom: 8, padding: '4px 0', borderBottom: '1px solid var(--bg-3)' }}>
              {rc.chain.map((e, ci) => (
                <div key={e._idx} className="issue-row" onClick={() => jumpTo(e._idx)} style={{ paddingLeft: ci * 12 }}>
                  <span className={`issue-status ${statusClass(e.status)}`}>{e.status}</span>
                  <span style={{ color: 'var(--text-3)', fontSize: 10 }}>{ci < rc.chain.length - 1 ? '→' : '●'}</span>
                  <span className="issue-url">{e.url.slice(0, 70)}</span>
                </div>
              ))}
            </div>
          ))}
        </Section>

        <Section title="Mixed Content (HTTP on HTTPS)" badge={issues.mixedContent.length} defaultOpen={issues.mixedContent.length > 0}>
          {issues.mixedContent.length === 0 && <div className="issues-empty">No mixed content</div>}
          {issues.mixedContent.slice(0, 20).map((e) => (
            <div key={e._idx} className="issue-row" onClick={() => jumpTo(e._idx)}>
              <span style={{ color: 'var(--red)', fontSize: 10, width: 16, flexShrink: 0 }}>⚠</span>
              <span className="issue-method">{e.method}</span>
              <span className="issue-url">{e.url.slice(0, 80)}</span>
            </div>
          ))}
        </Section>

        <Section title="Duplicate Requests" badge={issues.duplicates.length} defaultOpen={issues.duplicates.length > 0}>
          {issues.duplicates.length === 0 && <div className="issues-empty">No duplicates found</div>}
          {issues.duplicates.slice(0, 20).map((d, i) => (
            <div key={i} className="issue-row" onClick={() => jumpTo(d.indices[0])}>
              <span className="issue-status" style={{ color: 'var(--orange)', width: 36 }}>×{d.count}</span>
              <span className="issue-method">{d.method}</span>
              <span className="issue-url">{d.url.slice(0, 80)}</span>
            </div>
          ))}
        </Section>

        <Section title="Largest Responses" badge={issues.large.length}>
          {issues.large.map((e) => (
            <div key={e._idx} className="issue-row" onClick={() => jumpTo(e._idx)}>
              <span className="issue-size">{formatBytes(e.size)}</span>
              <span className="issue-method">{e.method}</span>
              <span className="issue-url">{e.url.slice(0, 80)}</span>
            </div>
          ))}
        </Section>

        <Section title="Render-Blocking Resources" badge={issues.renderBlocking.length} defaultOpen={issues.renderBlocking.length > 0}>
          {issues.renderBlocking.length === 0 && <div className="issues-empty">None detected</div>}
          {issues.renderBlocking.slice(0, 20).map((e) => (
            <div key={e._idx} className="issue-row" onClick={() => jumpTo(e._idx)}>
              <span className="issue-status" style={{ color: 'var(--yellow)', width: 36 }}>{e.contentType}</span>
              <span className="issue-method">{e.method}</span>
              <span className="issue-url">{e.url.slice(0, 80)}</span>
            </div>
          ))}
        </Section>

        <Section title="Large Non-Image Responses (>1MB)" badge={issues.largeResponses.length} defaultOpen={issues.largeResponses.length > 0}>
          {issues.largeResponses.length === 0 && <div className="issues-empty">None found</div>}
          {issues.largeResponses.slice(0, 20).map((e) => (
            <div key={e._idx} className="issue-row" onClick={() => jumpTo(e._idx)}>
              <span className="issue-size">{formatBytes(e.size)}</span>
              <span className="issue-method">{e.method}</span>
              <span className="issue-url">{e.url.slice(0, 80)}</span>
            </div>
          ))}
        </Section>
      </div>
    </ResizableOverlay>
  )
}
