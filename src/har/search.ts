import { compileMatcher } from './filter'
import type { Entry } from './types'

export interface MatchLocations {
  url: boolean
  headers: boolean
  requestBody: boolean
  responseBody: boolean
  cookies: boolean
}

export type InspectorTab = 'headers' | 'payload' | 'response' | 'cookies' | 'timing' | 'raw' | 'websocket'

const pairs = (list: { name: string; value: string }[] | undefined) =>
  (list ?? []).map((p) => `${p.name} ${p.value}`).join(' ')

/** Where a query matches inside one entry — drives the row match badges and tab auto-selection. */
export function matchLocations(entry: Entry, query: string, useRegex: boolean): MatchLocations | null {
  const test = query.length >= 2 ? compileMatcher(query, useRegex) : null
  if (!test) return null
  const { request, response } = entry.raw
  return {
    url: test(`${entry.method} ${entry.url} ${entry.status} ${entry.statusText} ${entry.type}`),
    headers: test(`${pairs(request?.headers)} ${pairs(response?.headers)}`),
    requestBody: test(`${request?.postData?.text ?? ''} ${pairs(request?.postData?.params)}`),
    responseBody: test(response?.content?.text ?? ''),
    cookies: test(`${pairs(request?.cookies)} ${pairs(response?.cookies)}`),
  }
}

/** Priority: response body → request body → headers → cookies. */
export function bestTabForMatch(loc: MatchLocations | null): InspectorTab | null {
  if (!loc) return null
  if (loc.responseBody) return 'response'
  if (loc.requestBody) return 'payload'
  if (loc.headers) return 'headers'
  if (loc.cookies) return 'cookies'
  return null
}

let cacheKey = ''
let cache = new WeakMap<Entry, MatchLocations | null>()

/** Memoized per query so virtualized rows get a stable object across re-renders. */
export function cachedMatchLocations(entry: Entry, query: string, useRegex: boolean): MatchLocations | null {
  if (query.length < 2) return null
  const key = `${useRegex ? 'rx' : 'tx'}:${query}`
  if (key !== cacheKey) {
    cacheKey = key
    cache = new WeakMap()
  }
  if (!cache.has(entry)) cache.set(entry, matchLocations(entry, query, useRegex))
  return cache.get(entry) ?? null
}
