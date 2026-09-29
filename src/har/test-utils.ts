import { toEntry } from './parse'
import type { Entry, HarEntry } from './types'

type EntryOverrides = {
  method?: string
  url?: string
  status?: number
  mime?: string
  size?: number
  time?: number
  start?: number
  wait?: number
  requestHeaders?: Array<{ name: string; value: string }>
  responseHeaders?: Array<{ name: string; value: string }>
  requestBody?: string
  responseBody?: string
  redirectURL?: string
  initiator?: string
}

/** Minimal valid HAR entry for tests; every field can be overridden. */
export function harEntry(o: EntryOverrides = {}): HarEntry {
  const start = o.start ?? 0
  return {
    startedDateTime: new Date(Date.UTC(2026, 0, 1) + start).toISOString(),
    time: o.time ?? 100,
    request: {
      method: o.method ?? 'GET',
      url: o.url ?? 'https://example.com/',
      httpVersion: 'h2',
      headers: o.requestHeaders ?? [],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: 0,
      ...(o.requestBody ? { postData: { mimeType: 'application/json', text: o.requestBody } } : {}),
    },
    response: {
      status: o.status ?? 200,
      statusText: '',
      httpVersion: 'h2',
      headers: [{ name: 'content-type', value: o.mime ?? 'application/json' }, ...(o.responseHeaders ?? [])],
      cookies: [],
      content: {
        size: o.size ?? 1000,
        mimeType: o.mime ?? 'application/json',
        ...(o.responseBody ? { text: o.responseBody } : {}),
      },
      redirectURL: o.redirectURL ?? '',
      headersSize: 100,
      bodySize: o.size ?? 1000,
    },
    timings: { blocked: 0, dns: -1, connect: -1, ssl: -1, send: 1, wait: o.wait ?? 50, receive: 10 },
    ...(o.initiator ? { _initiator: { type: 'parser', url: o.initiator } } : {}),
  }
}

export function entry(id: number, o: EntryOverrides = {}): Entry {
  return toEntry(harEntry(o), id)
}
