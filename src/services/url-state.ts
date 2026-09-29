import type { FilterCriteria, SearchScope } from '@/har/filter'
import { useAppStore } from '@/store'

const SCOPES: SearchScope[] = ['url', 'headers', 'body', 'all']
const list = (value: string | null) => (value ? value.split(',').filter(Boolean) : [])
const num = (value: string | null) =>
  value !== null && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null

/** `#q=api&m=GET,POST&s=4xx&scope=all` — readable, so shared links can be hand-edited. */
export function encodeCriteria(c: FilterCriteria): string {
  const p = new URLSearchParams()
  if (c.query) p.set('q', c.query)
  if (c.useRegex) p.set('rx', '1')
  if (c.negate) p.set('neg', '1')
  if (c.scope !== 'url') p.set('scope', c.scope)
  if (c.methods.length) p.set('m', c.methods.join(','))
  if (c.statuses.length) p.set('s', c.statuses.join(','))
  if (c.types.length) p.set('t', c.types.join(','))
  if (c.domains.length) p.set('d', c.domains.join(','))
  if (c.minTime !== null) p.set('tmin', String(c.minTime))
  if (c.maxTime !== null) p.set('tmax', String(c.maxTime))
  if (c.minSize !== null) p.set('smin', String(c.minSize))
  if (c.maxSize !== null) p.set('smax', String(c.maxSize))
  return p.toString()
}

function decodeLegacy(raw: string): Partial<FilterCriteria> | null {
  // v1 links stored URI-encoded JSON: #%7B"q":"api","m":["GET"]%7D
  try {
    const v1 = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>
    const strings = (v: unknown) =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
    return {
      query: typeof v1.q === 'string' ? v1.q : '',
      methods: strings(v1.m),
      statuses: strings(v1.s),
      types: strings(v1.t),
      domains: strings(v1.d),
      useRegex: v1.rx === true,
      negate: v1.neg === true,
    }
  } catch {
    return null
  }
}

export function decodeCriteria(hash: string): Partial<FilterCriteria> | null {
  const raw = hash.replace(/^#/, '')
  if (!raw) return null
  if (raw.startsWith('%7B') || raw.startsWith('{')) return decodeLegacy(raw)
  const p = new URLSearchParams(raw)
  const scope = p.get('scope') as SearchScope | null
  return {
    query: p.get('q') ?? '',
    useRegex: p.get('rx') === '1',
    negate: p.get('neg') === '1',
    scope: scope && SCOPES.includes(scope) ? scope : 'url',
    methods: list(p.get('m')),
    statuses: list(p.get('s')),
    types: list(p.get('t')),
    domains: list(p.get('d')),
    minTime: num(p.get('tmin')),
    maxTime: num(p.get('tmax')),
    minSize: num(p.get('smin')),
    maxSize: num(p.get('smax')),
  }
}

/** Filters from a shared link win over persisted ones. */
export function applyCriteriaFromHash(): void {
  const criteria = decodeCriteria(window.location.hash)
  if (criteria) useAppStore.getState().applyCriteria(criteria)
}
