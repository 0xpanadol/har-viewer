import { statusGroup } from './parse'
import type { Entry } from './types'

export type SearchScope = 'url' | 'headers' | 'body' | 'all'
export type SortColumn = 'method' | 'url' | 'status' | 'type' | 'size' | 'time' | 'start'
export type SortDirection = 'asc' | 'desc'

export interface SortState {
  column: SortColumn | null
  direction: SortDirection
}

export interface FilterCriteria {
  query: string
  useRegex: boolean
  negate: boolean
  scope: SearchScope
  methods: string[]
  statuses: string[]
  types: string[]
  domains: string[]
  minTime: number | null
  maxTime: number | null
  minSize: number | null
  maxSize: number | null
  /** Start-time window as ms offsets from the capture start. */
  timeWindow: [number, number] | null
}

export const EMPTY_CRITERIA: FilterCriteria = {
  query: '',
  useRegex: false,
  negate: false,
  scope: 'url',
  methods: [],
  statuses: [],
  types: [],
  domains: [],
  minTime: null,
  maxTime: null,
  minSize: null,
  maxSize: null,
  timeWindow: null,
}

export type Matcher = (haystack: string) => boolean

/** Case-insensitive substring or regex matcher; invalid regex falls back to substring. */
export function compileMatcher(query: string, useRegex: boolean): Matcher | null {
  if (!query) return null
  if (useRegex) {
    try {
      const re = new RegExp(query, 'i')
      return (s) => re.test(s)
    } catch {
      /* invalid pattern — treat as plain text */
    }
  }
  const needle = query.toLowerCase()
  return (s) => s.toLowerCase().includes(needle)
}

export function isValidRegex(query: string): boolean {
  try {
    new RegExp(query)
    return true
  } catch {
    return false
  }
}

const joinPairs = (pairs: { name: string; value: string }[] | undefined) =>
  (pairs ?? []).map((p) => `${p.name}: ${p.value}`).join('\n')

const haystackCache = new WeakMap<Entry, Partial<Record<SearchScope, string>>>()

/** Text searched for a scope. Cached per entry because building header/body text is costly. */
export function haystack(entry: Entry, scope: SearchScope): string {
  let cached = haystackCache.get(entry)
  if (!cached) {
    cached = {}
    haystackCache.set(entry, cached)
  }
  const hit = cached[scope]
  if (hit !== undefined) return hit

  const { request, response } = entry.raw
  const url = `${entry.method} ${entry.url} ${entry.status} ${entry.statusText} ${entry.type}`
  const headers = `${joinPairs(request?.headers)}\n${joinPairs(response?.headers)}`
  const body = `${request?.postData?.text ?? ''}\n${response?.content?.text ?? ''}`
  const value =
    scope === 'url'
      ? url
      : scope === 'headers'
        ? headers
        : scope === 'body'
          ? body
          : `${url}\n${headers}\n${body}`
  cached[scope] = value
  return value
}

/** All criteria except the time window — the histogram shows this set so brushing keeps context. */
export function filterEntries(entries: readonly Entry[], c: FilterCriteria): Entry[] {
  const matcher = compileMatcher(c.query, c.useRegex)
  const methods = new Set(c.methods)
  const statuses = new Set(c.statuses)
  const types = new Set(c.types)
  const domains = new Set(c.domains)

  return entries.filter((e) => {
    if (methods.size && !methods.has(e.method)) return false
    if (statuses.size && !statuses.has(statusGroup(e.status))) return false
    if (types.size && !types.has(e.type)) return false
    if (domains.size && !domains.has(e.host)) return false
    if (c.minTime !== null && e.time < c.minTime) return false
    if (c.maxTime !== null && e.time > c.maxTime) return false
    if (c.minSize !== null && e.size < c.minSize) return false
    if (c.maxSize !== null && e.size > c.maxSize) return false
    if (matcher && matcher(haystack(e, c.scope)) === c.negate) return false
    return true
  })
}

export function applyTimeWindow(
  entries: Entry[],
  window: [number, number] | null,
  captureStart: number,
): Entry[] {
  if (!window) return entries
  const [from, to] = window
  return entries.filter((e) => {
    const offset = e.startTime - captureStart
    return offset >= from && offset <= to
  })
}

const COMPARATORS: Record<SortColumn, (a: Entry, b: Entry) => number> = {
  method: (a, b) => a.method.localeCompare(b.method),
  url: (a, b) => a.url.localeCompare(b.url),
  status: (a, b) => a.status - b.status,
  type: (a, b) => a.type.localeCompare(b.type),
  size: (a, b) => a.size - b.size,
  time: (a, b) => a.time - b.time,
  start: (a, b) => a.startTime - b.startTime,
}

export function sortEntries(entries: Entry[], sort: SortState): Entry[] {
  if (!sort.column) return entries
  const compare = COMPARATORS[sort.column]
  const dir = sort.direction === 'asc' ? 1 : -1
  return entries.toSorted((a, b) => compare(a, b) * dir || a.id - b.id)
}

/** Pinned entries float to the top, keeping their relative order. */
export function pinFirst(entries: Entry[], pinned: ReadonlySet<number>): Entry[] {
  if (!pinned.size) return entries
  const top: Entry[] = []
  const rest: Entry[] = []
  for (const e of entries) (pinned.has(e.id) ? top : rest).push(e)
  return top.length ? top.concat(rest) : entries
}

export function countActiveFilters(c: FilterCriteria): number {
  return (
    (c.query ? 1 : 0) +
    (c.methods.length ? 1 : 0) +
    (c.statuses.length ? 1 : 0) +
    (c.types.length ? 1 : 0) +
    (c.domains.length ? 1 : 0) +
    (c.minTime !== null || c.maxTime !== null ? 1 : 0) +
    (c.minSize !== null || c.maxSize !== null ? 1 : 0) +
    (c.timeWindow ? 1 : 0)
  )
}

/** Parses "250", "10kb", "1.5 MB" into bytes. */
export function parseByteSize(input: string): number | null {
  const match = input
    .trim()
    .toLowerCase()
    .match(/^(\d+(?:\.\d+)?)\s*(b|kb|k|mb|m|gb|g)?$/)
  if (!match) return null
  const n = Number(match[1])
  const unit = match[2] ?? 'b'
  const factor = unit.startsWith('g')
    ? 1024 ** 3
    : unit.startsWith('m')
      ? 1024 ** 2
      : unit.startsWith('k')
        ? 1024
        : 1
  return Math.round(n * factor)
}
