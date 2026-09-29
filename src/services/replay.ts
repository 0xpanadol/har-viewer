import type { Entry } from '@/har/types'

export interface ReplayResult {
  status: number
  statusText: string
  headers: Array<[string, string]>
  body: string
  durationMs: number
}

/** Headers the browser forbids or computes itself; sending them makes fetch() throw or lie. */
const FORBIDDEN = new Set([
  'host',
  'content-length',
  'connection',
  'accept-encoding',
  'cookie',
  'origin',
  'referer',
  'user-agent',
  'sec-fetch-site',
  'sec-fetch-mode',
  'sec-fetch-dest',
  'sec-fetch-user',
])

const BODY_LIMIT = 200_000

/**
 * Re-issues the request from this page. Cross-origin requests only succeed when the
 * server allows CORS for this origin; cookies are never sent.
 */
export async function replayRequest(entry: Entry, signal?: AbortSignal): Promise<ReplayResult> {
  const request = entry.raw.request
  const headers = new Headers()
  for (const h of request?.headers ?? []) {
    const name = h.name.toLowerCase()
    if (name.startsWith(':') || name.startsWith('sec-ch-') || FORBIDDEN.has(name)) continue
    try {
      headers.set(h.name, h.value)
    } catch {
      /* invalid header name/value for fetch — skip */
    }
  }
  const method = request?.method || 'GET'
  const body = method !== 'GET' && method !== 'HEAD' ? request?.postData?.text : undefined

  const started = performance.now()
  const response = await fetch(entry.url, {
    method,
    headers,
    body,
    mode: 'cors',
    credentials: 'omit',
    signal,
  })
  const text = await response.text()
  return {
    status: response.status,
    statusText: response.statusText,
    headers: [...response.headers],
    body:
      text.length > BODY_LIMIT
        ? `${text.slice(0, BODY_LIMIT)}\n\n… truncated (${text.length.toLocaleString()} chars)`
        : text,
    durationMs: performance.now() - started,
  }
}
