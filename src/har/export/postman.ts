import { findHeader } from '../parse'
import type { HarEntry } from '../types'

const SKIPPED = new Set(['host', 'content-length', 'connection'])

function toItem(entry: HarEntry) {
  const url = entry.request?.url ?? ''
  const method = entry.request?.method || 'GET'
  let parsed: URL | null = null
  try {
    parsed = new URL(url)
  } catch {
    /* keep raw url only */
  }

  const request: Record<string, unknown> = {
    method,
    header: (entry.request?.headers ?? [])
      .filter((h) => !SKIPPED.has(h.name.toLowerCase()) && !h.name.startsWith(':'))
      .map((h) => ({ key: h.name, value: h.value })),
    url: {
      raw: url,
      protocol: parsed?.protocol.replace(':', '') ?? 'https',
      host: parsed?.hostname.split('.') ?? [],
      port: parsed?.port ?? '',
      path: parsed?.pathname.split('/').filter(Boolean) ?? [],
      query: parsed ? [...parsed.searchParams].map(([key, value]) => ({ key, value })) : [],
    },
  }

  const text = entry.request?.postData?.text
  if (text) {
    const contentType = findHeader(entry.request.headers, 'content-type') ?? ''
    const language = contentType.includes('json') ? 'json' : contentType.includes('xml') ? 'xml' : undefined
    request.body = { mode: 'raw', raw: text, ...(language ? { options: { raw: { language } } } : {}) }
  }

  return { name: `${method} ${parsed?.pathname ?? url}`, request }
}

/** Postman Collection v2.1 */
export function toPostmanCollection(entries: readonly HarEntry[], name: string): string {
  const collection = {
    info: {
      name,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: entries.map(toItem),
  }
  return JSON.stringify(collection, null, 2)
}
