import type { HarEntry, HarFile, HarLog, HarNameValue } from '../types'

const CREATOR = { name: 'HAR Viewer', version: '2.0' }

export function buildHarDocument(entries: HarEntry[], source: HarLog | null, creator = CREATOR): HarFile {
  return {
    log: {
      version: source?.version || '1.2',
      creator,
      pages: source?.pages ?? [],
      entries,
    },
  }
}

export const SENSITIVE_HEADERS = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'x-csrf-token',
  'x-xsrf-token',
  'x-forwarded-for',
  'x-real-ip',
  'x-amz-security-token',
  'x-amz-credential',
])

const SENSITIVE_BODY = /password|passwd|token|secret|api[_-]?key|client[_-]?secret/i
const SENSITIVE_QUERY = /token|key|secret|signature|sig|auth|session|code/i
const REDACTED = '[REDACTED]'

const redactHeaders = (headers: HarNameValue[] | undefined) =>
  headers?.map((h) => (SENSITIVE_HEADERS.has(h.name.toLowerCase()) ? { ...h, value: REDACTED } : h))

function redactUrl(url: string): string {
  try {
    const u = new URL(url)
    for (const key of [...u.searchParams.keys()])
      if (SENSITIVE_QUERY.test(key)) u.searchParams.set(key, REDACTED)
    return u.toString()
  } catch {
    return url
  }
}

/** Deep-copies entries with credentials, cookies and secret-looking payloads redacted. */
export function sanitizeEntries(entries: HarEntry[]): HarEntry[] {
  return entries.map((original) => {
    const e = structuredClone(original)
    if (e.request) {
      e.request.url = redactUrl(e.request.url)
      e.request.headers = redactHeaders(e.request.headers) ?? []
      e.request.cookies = (e.request.cookies ?? []).map((c) => ({ ...c, value: REDACTED }))
      e.request.queryString = (e.request.queryString ?? []).map((q) =>
        SENSITIVE_QUERY.test(q.name) ? { ...q, value: REDACTED } : q,
      )
      if (e.request.postData?.text && SENSITIVE_BODY.test(e.request.postData.text)) {
        e.request.postData.text = '[REDACTED — body may contain credentials]'
      }
      if (e.request.postData?.params) {
        e.request.postData.params = e.request.postData.params.map((p) =>
          SENSITIVE_BODY.test(p.name) ? { ...p, value: REDACTED } : p,
        )
      }
    }
    if (e.response) {
      e.response.headers = redactHeaders(e.response.headers) ?? []
      e.response.cookies = (e.response.cookies ?? []).map((c) => ({ ...c, value: REDACTED }))
    }
    return e
  })
}

/** Concatenates logs and orders entries chronologically. */
export function mergeLogs(logs: HarLog[]): HarLog {
  const entries = logs
    .flatMap((log) => log.entries)
    .toSorted((a, b) => Date.parse(a.startedDateTime) - Date.parse(b.startedDateTime))
  return {
    version: '1.2',
    creator: { name: 'HAR Viewer (merged)', version: CREATOR.version },
    pages: logs.flatMap((log) => log.pages ?? []),
    entries,
  }
}
