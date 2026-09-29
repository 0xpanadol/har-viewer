import { statusGroup } from './parse'
import type { Entry, StatusGroup } from './types'

export type FacetKind = 'methods' | 'statuses' | 'types' | 'domains'

export interface FacetOption {
  value: string
  count: number
}

export const STATUS_LABELS: Record<StatusGroup, string> = {
  '1xx': 'Informational',
  '2xx': 'Success',
  '3xx': 'Redirect',
  '4xx': 'Client error',
  '5xx': 'Server error',
  failed: 'Failed',
}

const STATUS_ORDER: StatusGroup[] = ['1xx', '2xx', '3xx', '4xx', '5xx', 'failed']
const METHOD_ORDER = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
const TYPE_ORDER = [
  'html',
  'js',
  'css',
  'json',
  'img',
  'font',
  'xml',
  'text',
  'form',
  'video',
  'audio',
  'bin',
]

function rankBy(order: readonly string[]) {
  return (a: FacetOption, b: FacetOption) => {
    const ia = order.indexOf(a.value)
    const ib = order.indexOf(b.value)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return b.count - a.count
  }
}

function tally(entries: readonly Entry[], key: (e: Entry) => string): FacetOption[] {
  const counts = new Map<string, number>()
  for (const e of entries) {
    const k = key(e)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts].map(([value, count]) => ({ value, count }))
}

export interface FacetCounts {
  statuses: FacetOption[]
  methods: FacetOption[]
  types: FacetOption[]
  domains: FacetOption[]
}

export function computeFacets(entries: readonly Entry[]): FacetCounts {
  return {
    statuses: tally(entries, (e) => statusGroup(e.status)).sort(rankBy(STATUS_ORDER)),
    methods: tally(entries, (e) => e.method).sort(rankBy(METHOD_ORDER)),
    types: tally(entries, (e) => e.type).sort(rankBy(TYPE_ORDER)),
    domains: tally(entries, (e) => e.host).sort(
      (a, b) => b.count - a.count || a.value.localeCompare(b.value),
    ),
  }
}
