import type { Entry } from '@/har/types'

export interface Lane {
  host: string
  rows: Entry[][]
  count: number
  errors: number
}

const MAX_ROWS = 10

/** Groups requests by domain and packs overlapping ones into stacked rows (interval packing). */
export function packLanes(entries: readonly Entry[]): Lane[] {
  const byHost = new Map<string, Entry[]>()
  for (const e of entries.toSorted((a, b) => a.startTime - b.startTime)) {
    byHost.set(e.host, [...(byHost.get(e.host) ?? []), e])
  }

  return [...byHost].map(([host, list]) => {
    const rows: Entry[][] = []
    const rowEnds: number[] = []
    for (const e of list) {
      let row = rowEnds.findIndex((end) => end <= e.startTime)
      if (row === -1) row = rows.length < MAX_ROWS ? rows.length : rowEnds.indexOf(Math.min(...rowEnds))
      rows[row] = [...(rows[row] ?? []), e]
      rowEnds[row] = Math.max(rowEnds[row] ?? 0, e.startTime + e.time)
    }
    return {
      host,
      rows,
      count: list.length,
      errors: list.filter((e) => e.status >= 400 || e.status === 0).length,
    }
  })
}
