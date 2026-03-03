import type { HarEntry, HarLog, ParsedEntry, ValidationWarning } from './types'

export function getContentType(entry: HarEntry): string {
  const ct = entry.response?.content?.mimeType || ''
  const h = (entry.response?.headers || []).find(
    (h) => h.name.toLowerCase() === 'content-type'
  )
  const full = h ? h.value : ct
  if (/json/i.test(full)) return 'json'
  if (/javascript/i.test(full)) return 'js'
  if (/css/i.test(full)) return 'css'
  if (/html/i.test(full)) return 'html'
  if (/xml/i.test(full)) return 'xml'
  if (/image/i.test(full)) return 'img'
  if (/font/i.test(full)) return 'font'
  if (/video/i.test(full)) return 'video'
  if (/audio/i.test(full)) return 'audio'
  if (/text/i.test(full)) return 'text'
  if (/form/i.test(full)) return 'form'
  if (/octet/i.test(full)) return 'bin'
  return full.split('/').pop()?.split(';')[0] || '—'
}

export function parseUrl(url: string): { host: string; path: string; full: string } {
  try {
    const u = new URL(url)
    return { host: u.host, path: u.pathname + u.search, full: url }
  } catch {
    return { host: '', path: url, full: url }
  }
}

export function getEntrySize(e: HarEntry): number {
  const cs = e.response?.content?.size
  const bs = e.response?.bodySize
  if (cs && cs > 0) return cs
  if (bs && bs > 0) return bs
  return -1
}

export function parseHarEntries(entries: HarEntry[]): ParsedEntry[] {
  return entries.map((e, i) => {
    const parsed = parseUrl(e.request?.url || '')
    return {
      _idx: i,
      _raw: e,
      method: e.request?.method || '?',
      url: e.request?.url || '',
      host: parsed.host,
      path: parsed.path,
      status: e.response?.status || 0,
      statusText: e.response?.statusText || '',
      contentType: getContentType(e),
      size: getEntrySize(e),
      time: e.time || 0,
      startTime: new Date(e.startedDateTime).getTime() || 0,
      timings: e.timings || { blocked: -1, dns: -1, connect: -1, ssl: -1, send: 0, wait: 0, receive: 0 },
    }
  })
}

export function tryDecodeBase64(s: string): string | null {
  try {
    return atob(s)
  } catch {
    return null
  }
}

export function tryParseJson(s: string): unknown | null {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

export function prettyJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2)
}

/** Validate HAR entries and return warnings */
export function validateHar(log: HarLog): ValidationWarning[] {
  const warnings: ValidationWarning[] = []
  const entries = log.entries || []

  entries.forEach((e, i) => {
    if (!e.startedDateTime) {
      warnings.push({ idx: i, type: 'warning', message: 'Missing startedDateTime' })
    }
    if (!e.request?.url) {
      warnings.push({ idx: i, type: 'error', message: 'Missing request URL' })
    }
    if (!e.request?.method) {
      warnings.push({ idx: i, type: 'warning', message: 'Missing request method' })
    }
    if (e.response?.bodySize !== undefined && e.response.bodySize < -1) {
      warnings.push({ idx: i, type: 'warning', message: `Negative body size: ${e.response.bodySize}` })
    }
    if (e.response?.content?.size !== undefined && e.response.content.size < -1) {
      warnings.push({ idx: i, type: 'warning', message: `Negative content size: ${e.response.content.size}` })
    }
    if (e.time !== undefined && e.time < 0) {
      warnings.push({ idx: i, type: 'warning', message: `Negative time: ${e.time}` })
    }
    if (!e.timings) {
      warnings.push({ idx: i, type: 'warning', message: 'Missing timings data' })
    }
    if (e.response?.status === 0 && !e.response?.statusText) {
      warnings.push({ idx: i, type: 'warning', message: 'Status 0 — possibly incomplete/aborted request' })
    }
  })

  if (!log.version) {
    warnings.push({ idx: -1, type: 'warning', message: 'Missing HAR version field' })
  }
  if (!log.creator) {
    warnings.push({ idx: -1, type: 'warning', message: 'Missing HAR creator field' })
  }

  return warnings
}
