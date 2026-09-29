import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/charts'
import type { CaptureStats } from '@/har/compare'
import { cn } from '@/lib/cn'
import { formatBytes, formatDelta, formatDuration, formatNumber } from '@/lib/format'

interface Metric {
  label: string
  a: number
  b: number
  format: (n: number) => string
  /** Whether an increase is good, bad, or neutral. */
  better?: 'lower' | 'higher'
}

function Delta({ metric }: { metric: Metric }) {
  const diff = metric.b - metric.a
  if (diff === 0) return <span className="text-subtle-foreground">no change</span>
  const improved = metric.better === 'lower' ? diff < 0 : metric.better === 'higher' ? diff > 0 : null
  const Icon = diff > 0 ? ArrowUpRight : ArrowDownRight
  const pct = metric.a ? ` (${diff > 0 ? '+' : '−'}${Math.abs((diff / metric.a) * 100).toFixed(0)}%)` : ''
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        improved === true && 'text-success',
        improved === false && 'text-danger',
        improved === null && 'text-muted-foreground',
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {formatDelta(diff, metric.format)}
      <span className="text-subtle-foreground">{pct}</span>
      <span className="sr-only">
        {improved === true ? 'improved' : improved === false ? 'regressed' : ''}
      </span>
    </span>
  )
}

export function CompareSummary({
  a,
  b,
  nameA,
  nameB,
}: {
  a: CaptureStats
  b: CaptureStats
  nameA: string
  nameB: string
}) {
  const metrics: Metric[] = [
    { label: 'Requests', a: a.count, b: b.count, format: formatNumber, better: 'lower' },
    { label: 'Total size', a: a.totalBytes, b: b.totalBytes, format: formatBytes, better: 'lower' },
    { label: 'Total time', a: a.totalTime, b: b.totalTime, format: formatDuration, better: 'lower' },
    { label: 'Average time', a: a.avgTime, b: b.avgTime, format: formatDuration, better: 'lower' },
    { label: 'Failed', a: a.errors, b: b.errors, format: formatNumber, better: 'lower' },
    { label: 'Domains', a: a.domains, b: b.domains, format: formatNumber },
  ]

  return (
    <Card title="Summary" description="Change from baseline to comparison">
      <table className="w-full text-xs">
        <thead className="text-left text-muted-foreground">
          <tr className="border-b">
            <th className="px-4 py-2 font-medium">Metric</th>
            <th className="max-w-0 truncate px-2 py-2 text-right font-medium" title={nameA}>
              Baseline
            </th>
            <th className="max-w-0 truncate px-2 py-2 text-right font-medium" title={nameB}>
              Comparison
            </th>
            <th className="px-4 py-2 text-right font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.label} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-2 text-muted-foreground">{m.label}</td>
              <td className="px-2 py-2 text-right tabular">{m.format(m.a)}</td>
              <td className="px-2 py-2 text-right font-medium tabular">{m.format(m.b)}</td>
              <td className="px-4 py-2 text-right tabular">
                <Delta metric={m} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
