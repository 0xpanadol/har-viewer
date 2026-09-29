import { useState } from 'react'
import { Card, Meter } from '@/components/charts'
import { SegmentedControl, SegmentedItem } from '@/components/ui/tabs'
import { STATUS_LABELS } from '@/har/facets'
import { groupEntries, type GroupKey } from '@/har/metrics'
import type { Entry, StatusGroup } from '@/har/types'
import { formatBytes, formatDuration, formatNumber, formatPercent } from '@/lib/format'
import { useAppStore } from '@/store'
import type { FacetKind } from '@/har/facets'

const FACET: Record<GroupKey, FacetKind> = { domain: 'domains', type: 'types', status: 'statuses' }

/** Pivot table (the former "grouping" panel). Clicking a row filters the request list to it. */
export function BreakdownCard({ entries }: { entries: readonly Entry[] }) {
  const [by, setBy] = useState<GroupKey>('domain')
  const rows = groupEntries(entries, by)
  const total = entries.length || 1

  const drillDown = (key: string) => {
    const store = useAppStore.getState()
    store.resetFilters()
    store.setFacet(FACET[by], [key === '(none)' ? '' : key])
    store.setView('requests')
  }

  return (
    <Card
      title="Breakdown"
      description="Click a row to see its requests"
      actions={
        <SegmentedControl
          type="single"
          value={by}
          onValueChange={(v) => v && setBy(v as GroupKey)}
          aria-label="Group by"
        >
          <SegmentedItem value="domain">Domain</SegmentedItem>
          <SegmentedItem value="type">Type</SegmentedItem>
          <SegmentedItem value="status">Status</SegmentedItem>
        </SegmentedControl>
      }
    >
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-panel text-left text-muted-foreground">
            <tr className="border-b">
              <th className="px-4 py-2 font-medium">
                {by === 'domain' ? 'Domain' : by === 'type' ? 'Type' : 'Status'}
              </th>
              <th className="w-40 px-2 py-2 font-medium">Share</th>
              <th className="px-2 py-2 text-right font-medium">Requests</th>
              <th className="px-2 py-2 text-right font-medium">Size</th>
              <th className="px-2 py-2 text-right font-medium">Avg time</th>
              <th className="px-4 py-2 text-right font-medium">Errors</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.key}
                onClick={() => drillDown(row.key)}
                className="cursor-default border-b border-border/60 last:border-0 hover:bg-muted/60"
              >
                <td className="max-w-0 truncate px-4 py-1.5 font-mono" title={row.key}>
                  {row.key}
                  {by === 'status' && (
                    <span className="ml-2 font-sans text-subtle-foreground">
                      {STATUS_LABELS[row.key as StatusGroup]}
                    </span>
                  )}
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <Meter ratio={row.count / total} />
                    <span className="w-9 shrink-0 text-right text-subtle-foreground tabular">
                      {formatPercent(row.count / total)}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-right tabular">{formatNumber(row.count)}</td>
                <td className="px-2 py-1.5 text-right text-muted-foreground tabular">
                  {formatBytes(row.bytes)}
                </td>
                <td className="px-2 py-1.5 text-right text-muted-foreground tabular">
                  {formatDuration(row.avgTime)}
                </td>
                <td className="px-4 py-1.5 text-right tabular">
                  {row.errors ? (
                    <span className="text-danger">{row.errors}</span>
                  ) : (
                    <span className="text-subtle-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
