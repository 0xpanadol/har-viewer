import { findHeader } from './parse'
import type { Entry } from './types'

export type IssueSeverity = 'critical' | 'warning' | 'info'

export interface IssueItem {
  /** One entry for most checks; the full hop list for redirect chains, all copies for duplicates. */
  entries: Entry[]
  metric: string
}

export interface IssueCheck {
  id: string
  title: string
  description: string
  severity: IssueSeverity
  items: IssueItem[]
}

export const THRESHOLDS = {
  slowRequestMs: 2000,
  slowTtfbMs: 800,
  largeImageBytes: 200 * 1024,
  largeResponseBytes: 1024 * 1024,
  renderBlockingWindow: 20,
} as const

const kb = (bytes: number) => `${Math.round(bytes / 1024).toLocaleString()} KB`
const ms = (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`)
const single = (entry: Entry, metric: string): IssueItem => ({ entries: [entry], metric })

function httpErrors(entries: readonly Entry[]): IssueItem[] {
  return entries.filter((e) => e.status >= 400 || e.status === 0).map((e) => single(e, ms(e.time)))
}

function slowTtfb(entries: readonly Entry[]): IssueItem[] {
  return entries
    .filter((e) => e.timings.wait > THRESHOLDS.slowTtfbMs)
    .sort((a, b) => b.timings.wait - a.timings.wait)
    .map((e) => single(e, ms(e.timings.wait)))
}

function slowRequests(entries: readonly Entry[]): IssueItem[] {
  return entries
    .filter((e) => e.time >= THRESHOLDS.slowRequestMs)
    .sort((a, b) => b.time - a.time)
    .map((e) => single(e, ms(e.time)))
}

function missingCacheHeaders(entries: readonly Entry[]): IssueItem[] {
  return entries
    .filter((e) => {
      if (e.status < 200 || e.status >= 400 || e.status === 304) return false
      if (!['js', 'css', 'img', 'font'].includes(e.type)) return false
      const headers = e.raw.response?.headers
      return (
        !findHeader(headers, 'cache-control') &&
        !findHeader(headers, 'expires') &&
        !findHeader(headers, 'etag')
      )
    })
    .map((e) => single(e, e.type))
}

function oversizedImages(entries: readonly Entry[]): IssueItem[] {
  return entries
    .filter((e) => e.type === 'img' && e.size > THRESHOLDS.largeImageBytes)
    .sort((a, b) => b.size - a.size)
    .map((e) => single(e, kb(e.size)))
}

function largeResponses(entries: readonly Entry[]): IssueItem[] {
  return entries
    .filter((e) => e.type !== 'img' && e.size > THRESHOLDS.largeResponseBytes)
    .sort((a, b) => b.size - a.size)
    .map((e) => single(e, kb(e.size)))
}

function renderBlocking(entries: readonly Entry[]): IssueItem[] {
  // Heuristic: early JS/CSS that took meaningful time is likely on the critical path.
  const byStart = entries
    .toSorted((a, b) => a.startTime - b.startTime)
    .slice(0, THRESHOLDS.renderBlockingWindow)
  return byStart
    .filter((e) => (e.type === 'js' || e.type === 'css') && e.time > 100)
    .map((e) => single(e, ms(e.time)))
}

function redirectChains(entries: readonly Entry[]): IssueItem[] {
  const byUrl = new Map<string, Entry[]>()
  for (const e of entries) byUrl.set(e.url, [...(byUrl.get(e.url) ?? []), e])

  const visited = new Set<number>()
  const chains: IssueItem[] = []
  for (const start of entries) {
    if (start.status < 300 || start.status >= 400 || visited.has(start.id)) continue
    const chain = [start]
    visited.add(start.id)
    let next: string | undefined = start.raw.response?.redirectURL
    while (next && chain.length < 12) {
      const target: Entry | undefined = byUrl.get(next)?.find((e) => !visited.has(e.id))
      if (!target) break
      chain.push(target)
      visited.add(target.id)
      next = target.status >= 300 && target.status < 400 ? target.raw.response?.redirectURL : undefined
    }
    if (chain.length >= 2)
      chains.push({ entries: chain, metric: `${chain.length - 1} hop${chain.length > 2 ? 's' : ''}` })
  }
  return chains.sort((a, b) => b.entries.length - a.entries.length)
}

function mixedContent(entries: readonly Entry[]): IssueItem[] {
  const secureContext = entries.some((e) => e.url.startsWith('https://'))
  if (!secureContext) return []
  return entries.filter((e) => e.url.startsWith('http://')).map((e) => single(e, 'http'))
}

function duplicates(entries: readonly Entry[]): IssueItem[] {
  const groups = new Map<string, Entry[]>()
  for (const e of entries) {
    const key = `${e.method} ${e.url}`
    groups.set(key, [...(groups.get(key) ?? []), e])
  }
  return [...groups.values()]
    .filter((group) => group.length > 1)
    .sort((a, b) => b.length - a.length)
    .map((group) => ({ entries: group, metric: `×${group.length}` }))
}

type CheckDefinition = Omit<IssueCheck, 'items'> & { run: (entries: readonly Entry[]) => IssueItem[] }

const CHECKS: CheckDefinition[] = [
  {
    id: 'errors',
    title: 'Failed requests',
    severity: 'critical',
    run: httpErrors,
    description: 'Responses with a 4xx/5xx status, or requests that never completed.',
  },
  {
    id: 'mixed',
    title: 'Mixed content',
    severity: 'critical',
    run: mixedContent,
    description:
      'Plain HTTP requests on a page that also loads HTTPS resources. Browsers block or warn on these.',
  },
  {
    id: 'ttfb',
    title: 'Slow server response',
    severity: 'warning',
    run: slowTtfb,
    description: `Time to first byte above ${THRESHOLDS.slowTtfbMs} ms usually points at backend latency.`,
  },
  {
    id: 'slow',
    title: 'Slow requests',
    severity: 'warning',
    run: slowRequests,
    description: `Requests taking longer than ${THRESHOLDS.slowRequestMs / 1000} s end to end.`,
  },
  {
    id: 'redirects',
    title: 'Redirect chains',
    severity: 'warning',
    run: redirectChains,
    description: 'Each hop adds a full round trip before the final resource loads.',
  },
  {
    id: 'images',
    title: 'Oversized images',
    severity: 'warning',
    run: oversizedImages,
    description: `Images larger than ${THRESHOLDS.largeImageBytes / 1024} KB. Consider modern formats or responsive sizes.`,
  },
  {
    id: 'large',
    title: 'Large responses',
    severity: 'warning',
    run: largeResponses,
    description: 'Non-image responses over 1 MB delay parsing and increase memory use.',
  },
  {
    id: 'cache',
    title: 'Missing cache headers',
    severity: 'info',
    run: missingCacheHeaders,
    description: 'Static assets without Cache-Control, Expires or ETag are re-downloaded on every visit.',
  },
  {
    id: 'blocking',
    title: 'Likely render-blocking',
    severity: 'info',
    run: renderBlocking,
    description:
      'Early scripts and stylesheets that took over 100 ms — candidates for defer, async or preload.',
  },
  {
    id: 'duplicates',
    title: 'Duplicate requests',
    severity: 'info',
    run: duplicates,
    description: 'The same method and URL requested more than once.',
  },
]

export function detectIssues(entries: readonly Entry[]): IssueCheck[] {
  return CHECKS.map(({ run, ...check }) => ({ ...check, items: run(entries) }))
}

export function issueCount(checks: readonly IssueCheck[]): number {
  return checks.reduce((sum, c) => sum + c.items.length, 0)
}
