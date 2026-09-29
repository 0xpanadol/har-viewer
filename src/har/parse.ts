import type { CaptureRange, Entry, HarEntry, HarLog, HarNameValue, StatusGroup } from './types'

export class HarParseError extends Error {
  override name = 'HarParseError'
}

/** Accepts either a full HAR document (`{ log }`) or a bare log object. */
export function normalizeLog(data: unknown): HarLog {
  if (!data || typeof data !== 'object') throw new HarParseError('File is not a JSON object.')
  const candidate = 'log' in data ? (data as { log: unknown }).log : data
  if (!candidate || typeof candidate !== 'object' || !Array.isArray((candidate as HarLog).entries)) {
    throw new HarParseError('No "log.entries" array found — this does not look like a HAR file.')
  }
  return candidate as HarLog
}

export function findHeader(headers: HarNameValue[] | undefined, name: string): string | undefined {
  const lower = name.toLowerCase()
  return headers?.find((h) => h.name.toLowerCase() === lower)?.value
}

const TYPE_PATTERNS: ReadonlyArray<[RegExp, string]> = [
  [/json/i, 'json'],
  [/javascript|ecmascript/i, 'js'],
  [/css/i, 'css'],
  [/html/i, 'html'],
  [/xml/i, 'xml'],
  [/image/i, 'img'],
  [/font/i, 'font'],
  [/video/i, 'video'],
  [/audio/i, 'audio'],
  [/text/i, 'text'],
  [/form/i, 'form'],
  [/octet|wasm/i, 'bin'],
]

export function resourceType(entry: HarEntry): string {
  const mime = findHeader(entry.response?.headers, 'content-type') ?? entry.response?.content?.mimeType ?? ''
  for (const [pattern, label] of TYPE_PATTERNS) {
    if (pattern.test(mime)) return label
  }
  return mime.split('/').pop()?.split(';')[0]?.trim() || 'other'
}

export function splitUrl(url: string): { host: string; path: string } {
  try {
    const u = new URL(url)
    return { host: u.host, path: u.pathname + u.search }
  } catch {
    return { host: '', path: url }
  }
}

export function statusGroup(status: number): StatusGroup {
  if (!status || status < 100) return 'failed'
  return `${Math.min(5, Math.floor(status / 100))}xx` as StatusGroup
}

function contentSize(e: HarEntry): number {
  const content = e.response?.content?.size
  const body = e.response?.bodySize
  if (content && content > 0) return content
  if (body && body > 0) return body
  return -1
}

function transferSize(e: HarEntry): number {
  const body = e.response?.bodySize ?? -1
  const headers = e.response?.headersSize ?? -1
  if (body < 0) return -1
  return body + Math.max(0, headers)
}

function initiatorOf(e: HarEntry): string {
  return e._initiator?.url || findHeader(e.request?.headers, 'referer') || ''
}

function normalizeTimings(e: HarEntry): Entry['timings'] {
  const t = e.timings
  return {
    blocked: t?.blocked ?? -1,
    dns: t?.dns ?? -1,
    connect: t?.connect ?? -1,
    ssl: t?.ssl ?? -1,
    send: t?.send ?? 0,
    wait: t?.wait ?? 0,
    receive: t?.receive ?? 0,
  }
}

export function toEntry(raw: HarEntry, id: number): Entry {
  const url = raw.request?.url ?? ''
  const { host, path } = splitUrl(url)
  return {
    id,
    raw,
    method: raw.request?.method || '?',
    url,
    host,
    path,
    status: raw.response?.status ?? 0,
    statusText: raw.response?.statusText ?? '',
    type: resourceType(raw),
    size: contentSize(raw),
    transferSize: transferSize(raw),
    time: Math.max(0, raw.time || 0),
    startTime: Date.parse(raw.startedDateTime) || 0,
    timings: normalizeTimings(raw),
    initiator: initiatorOf(raw),
    httpVersion: raw.response?.httpVersion || raw.request?.httpVersion || '',
  }
}

/** Builds entries; `ids` restores stable ids from a persisted session. */
export function toEntries(log: HarLog, ids?: readonly number[]): Entry[] {
  const useIds = ids && ids.length === log.entries.length
  return log.entries.map((raw, i) => toEntry(raw, useIds ? ids[i]! : i))
}

/** Earliest start and latest finish. Loops instead of Math.min(...) to stay safe on huge captures. */
export function captureRange(entries: readonly Entry[]): CaptureRange {
  let start = Infinity
  let end = -Infinity
  for (const e of entries) {
    if (!e.startTime) continue
    if (e.startTime < start) start = e.startTime
    if (e.startTime + e.time > end) end = e.startTime + e.time
  }
  return Number.isFinite(start) ? { start, end } : { start: 0, end: 0 }
}

export function withEntries(log: HarLog, entries: readonly Entry[]): HarLog {
  return { ...log, entries: entries.map((e) => e.raw) }
}
