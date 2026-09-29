import { statusGroup } from './parse'
import type { Entry } from './types'

export interface CaptureStats {
  count: number
  totalBytes: number
  totalTime: number
  avgTime: number
  errors: number
  domains: number
  byStatus: Record<string, number>
}

export function captureStats(entries: readonly Entry[]): CaptureStats {
  const byStatus: Record<string, number> = {}
  let totalBytes = 0
  let totalTime = 0
  let errors = 0
  const domains = new Set<string>()
  for (const e of entries) {
    totalBytes += Math.max(0, e.size)
    totalTime += e.time
    if (e.status >= 400 || e.status === 0) errors++
    domains.add(e.host)
    const group = statusGroup(e.status)
    byStatus[group] = (byStatus[group] ?? 0) + 1
  }
  return {
    count: entries.length,
    totalBytes,
    totalTime,
    avgTime: entries.length ? totalTime / entries.length : 0,
    errors,
    domains: domains.size,
    byStatus,
  }
}

export interface ChangedRequest {
  key: string
  before: Entry
  after: Entry
  timeDelta: number
  sizeDelta: number
}

export interface CaptureDiff {
  added: Entry[]
  removed: Entry[]
  changed: ChangedRequest[]
}

/** Endpoints are matched on method + path without query string. */
export const endpointKey = (e: Entry) => `${e.method} ${e.host}${e.path.split('?')[0]}`

const SIGNIFICANT_TIME_MS = 50
const SIGNIFICANT_SIZE_BYTES = 512

function index(entries: readonly Entry[]): Map<string, Entry[]> {
  const map = new Map<string, Entry[]>()
  for (const e of entries) {
    const key = endpointKey(e)
    map.set(key, [...(map.get(key) ?? []), e])
  }
  return map
}

export function diffCaptures(before: readonly Entry[], after: readonly Entry[]): CaptureDiff {
  const a = index(before)
  const b = index(after)
  const added: Entry[] = []
  const removed: Entry[] = []
  const changed: ChangedRequest[] = []

  for (const [key, list] of b) {
    const previous = a.get(key)?.[0]
    const current = list[0]!
    if (!previous) {
      added.push(...list)
      continue
    }
    const timeDelta = current.time - previous.time
    const sizeDelta = current.size - previous.size
    if (Math.abs(timeDelta) > SIGNIFICANT_TIME_MS || Math.abs(sizeDelta) > SIGNIFICANT_SIZE_BYTES) {
      changed.push({ key, before: previous, after: current, timeDelta, sizeDelta })
    }
  }
  for (const [key, list] of a) if (!b.has(key)) removed.push(...list)

  changed.sort((x, y) => Math.abs(y.timeDelta) - Math.abs(x.timeDelta))
  return { added, removed, changed }
}

export interface HeaderDelta {
  name: string
  before: string | undefined
  after: string | undefined
}

export function diffHeaders(
  before: { name: string; value: string }[] = [],
  after: { name: string; value: string }[] = [],
): HeaderDelta[] {
  const a = new Map(before.map((h) => [h.name.toLowerCase(), h.value]))
  const b = new Map(after.map((h) => [h.name.toLowerCase(), h.value]))
  return [...new Set([...a.keys(), ...b.keys()])]
    .sort()
    .filter((name) => a.get(name) !== b.get(name))
    .map((name) => ({ name, before: a.get(name), after: b.get(name) }))
}
