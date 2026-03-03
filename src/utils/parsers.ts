import type { HarEntry, ParsedEntry } from './types'

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
