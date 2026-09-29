import { captureRange, findHeader, statusGroup } from './parse'
import { PHASES, phaseSegments, type PhaseKey } from './timings'
import type { Entry, HarLog, StatusGroup } from './types'

const bytes = (n: number) => Math.max(0, n)

export interface CaptureSummary {
  requests: number
  contentBytes: number
  transferredBytes: number
  finish: number
  domContentLoaded: number | null
  load: number | null
  domains: number
  errors: number
}

export function summarize(entries: readonly Entry[], log: HarLog | null): CaptureSummary {
  const range = captureRange(entries)
  const page = log?.pages?.[0]?.pageTimings
  const positive = (v: number | undefined) => (v !== undefined && v > 0 ? v : null)
  let contentBytes = 0
  let transferredBytes = 0
  let errors = 0
  const domains = new Set<string>()
  for (const e of entries) {
    contentBytes += bytes(e.size)
    transferredBytes += bytes(e.transferSize)
    if (e.status >= 400 || e.status === 0) errors++
    domains.add(e.host)
  }
  return {
    requests: entries.length,
    contentBytes,
    transferredBytes,
    finish: range.end - range.start,
    domContentLoaded: positive(page?.onContentLoad),
    load: positive(page?.onLoad),
    domains: domains.size,
    errors,
  }
}

export type GroupKey = 'domain' | 'type' | 'status'

export interface GroupRow {
  key: string
  count: number
  bytes: number
  avgTime: number
  errors: number
}

export function groupEntries(entries: readonly Entry[], by: GroupKey): GroupRow[] {
  const keyOf = (e: Entry) =>
    by === 'domain' ? e.host || '(none)' : by === 'type' ? e.type : statusGroup(e.status)
  const rows = new Map<string, GroupRow & { totalTime: number }>()
  for (const e of entries) {
    const key = keyOf(e)
    const row = rows.get(key) ?? { key, count: 0, bytes: 0, avgTime: 0, errors: 0, totalTime: 0 }
    row.count++
    row.bytes += bytes(e.size)
    row.totalTime += e.time
    if (e.status >= 400 || e.status === 0) row.errors++
    rows.set(key, row)
  }
  return [...rows.values()]
    .map(({ totalTime, ...row }) => ({ ...row, avgTime: row.count ? totalTime / row.count : 0 }))
    .sort((a, b) => b.count - a.count)
}

export interface PerformanceProfile {
  cached: number
  fresh: number
  cacheHitRatio: number
  compressed: number
  uncompressed: number
  wireBytes: number
  decodedBytes: number
  compressionSavings: number
  preflights: number
  redirects: number
  connections: number
  httpVersions: Array<{ version: string; count: number }>
  avgPhases: Array<{ key: PhaseKey; label: string; swatch: string; avg: number }>
}

export function profilePerformance(entries: readonly Entry[]): PerformanceProfile {
  let cached = 0
  let fresh = 0
  let compressed = 0
  let uncompressed = 0
  let wireBytes = 0
  let decodedBytes = 0
  let preflights = 0
  let redirects = 0
  const connections = new Set<string>()
  const versions = new Map<string, number>()
  const phaseTotals = new Map<PhaseKey, number>()

  for (const e of entries) {
    if (e.status === 304) cached++
    else if (e.status >= 200 && e.status < 400) fresh++
    if (e.status >= 300 && e.status < 400 && e.status !== 304) redirects++
    if (e.method === 'OPTIONS') preflights++
    if (e.raw.connection) connections.add(e.raw.connection)

    const encoded = findHeader(e.raw.response?.headers, 'content-encoding')
    const body = e.raw.response?.bodySize ?? -1
    const decoded = e.raw.response?.content?.size ?? -1
    if (encoded) {
      compressed++
      if (body > 0 && decoded > 0) {
        wireBytes += body
        decodedBytes += decoded
      }
    } else {
      uncompressed++
    }

    const version = (e.httpVersion || 'unknown').toLowerCase()
    versions.set(version, (versions.get(version) ?? 0) + 1)
    for (const seg of phaseSegments(e))
      phaseTotals.set(seg.key, (phaseTotals.get(seg.key) ?? 0) + seg.duration)
  }

  const n = entries.length || 1
  return {
    cached,
    fresh,
    cacheHitRatio: cached + fresh ? cached / (cached + fresh) : 0,
    compressed,
    uncompressed,
    wireBytes,
    decodedBytes,
    compressionSavings: decodedBytes ? 1 - wireBytes / decodedBytes : 0,
    preflights,
    redirects,
    connections: connections.size,
    httpVersions: [...versions]
      .map(([version, count]) => ({ version, count }))
      .sort((a, b) => b.count - a.count),
    avgPhases: PHASES.map((p) => ({
      key: p.key,
      label: p.label,
      swatch: p.swatch,
      avg: (phaseTotals.get(p.key) ?? 0) / n,
    })),
  }
}

export type HistogramSeries = 'ok' | 'redirect' | 'clientError' | 'serverError'

export interface HistogramBucket {
  from: number
  to: number
  counts: Record<HistogramSeries, number>
  total: number
}

export function seriesOf(group: StatusGroup): HistogramSeries {
  if (group === '3xx') return 'redirect'
  if (group === '4xx') return 'clientError'
  if (group === '5xx' || group === 'failed') return 'serverError'
  return 'ok'
}

/** Request starts bucketed over the capture duration (offsets in ms from `start`). */
export function histogram(
  entries: readonly Entry[],
  start: number,
  duration: number,
  bucketCount: number,
): HistogramBucket[] {
  const count = Math.max(1, bucketCount)
  const width = Math.max(1, duration) / count
  const buckets: HistogramBucket[] = Array.from({ length: count }, (_, i) => ({
    from: i * width,
    to: (i + 1) * width,
    counts: { ok: 0, redirect: 0, clientError: 0, serverError: 0 },
    total: 0,
  }))
  for (const e of entries) {
    const index = Math.min(count - 1, Math.max(0, Math.floor((e.startTime - start) / width)))
    const bucket = buckets[index]!
    bucket.counts[seriesOf(statusGroup(e.status))]++
    bucket.total++
  }
  return buckets
}

export function topBy(entries: readonly Entry[], metric: (e: Entry) => number, limit: number): Entry[] {
  return entries
    .toSorted((a, b) => metric(b) - metric(a))
    .slice(0, limit)
    .filter((e) => metric(e) > 0)
}
