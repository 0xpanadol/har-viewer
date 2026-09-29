import { Card, Legend, Meter } from '@/components/charts'
import { STATUS_DOT, STATUS_SERIES } from '@/components/status-colors'
import { computeFacets, STATUS_LABELS } from '@/har/facets'
import { groupEntries, seriesOf } from '@/har/metrics'
import { statusGroup } from '@/har/parse'
import type { Entry, StatusGroup } from '@/har/types'
import { cn } from '@/lib/cn'
import { formatBytes, formatNumber, formatPercent } from '@/lib/format'

export function StatusCard({ entries }: { entries: readonly Entry[] }) {
  const statuses = computeFacets(entries).statuses
  const total = entries.length || 1
  const series = STATUS_SERIES.map((s) => ({
    ...s,
    count: entries.filter((e) => seriesOf(statusGroup(e.status)) === s.key).length,
  })).filter((s) => s.count > 0)
  return (
    <Card title="Status codes" description="Share of responses by class">
      <div className="flex flex-col gap-3 p-4">
        <div
          className="flex h-3 w-full gap-[2px] overflow-hidden rounded-[4px]"
          role="img"
          aria-label="Status code distribution"
        >
          {series.map((s) => (
            <span
              key={s.key}
              className={cn('h-full', s.swatch)}
              style={{ flexGrow: s.count }}
              title={`${s.label}: ${s.count}`}
            />
          ))}
        </div>
        <Legend items={series} />
        <table className="w-full text-xs">
          <tbody>
            {statuses.map((s) => (
              <tr key={s.value} className="border-t border-border/60">
                <td className="py-1.5">
                  <span className="inline-flex items-center gap-2">
                    <span className={cn('size-1.5 rounded-full', STATUS_DOT[s.value as StatusGroup])} />
                    <span className="font-mono">{s.value}</span>
                    <span className="text-muted-foreground">{STATUS_LABELS[s.value as StatusGroup]}</span>
                  </span>
                </td>
                <td className="py-1.5 text-right tabular">{formatNumber(s.count)}</td>
                <td className="w-14 py-1.5 text-right text-subtle-foreground tabular">
                  {formatPercent(s.count / total, 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function ContentTypeCard({ entries }: { entries: readonly Entry[] }) {
  const rows = groupEntries(entries, 'type').sort((a, b) => b.bytes - a.bytes)
  const maxBytes = Math.max(1, ...rows.map((r) => r.bytes))
  return (
    <Card title="Content types" description="Where the bytes go">
      <ul className="flex flex-col gap-2.5 p-4">
        {rows.slice(0, 10).map((row) => (
          <li key={row.key} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 text-xs">
            <span className="truncate font-mono">{row.key}</span>
            <Meter ratio={row.bytes / maxBytes} />
            <span className="w-32 text-right text-muted-foreground tabular">
              <span className="text-foreground">{formatBytes(row.bytes)}</span> · {formatNumber(row.count)}{' '}
              req
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
