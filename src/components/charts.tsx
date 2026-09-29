import type { ReactNode } from 'react'
import { PHASES } from '@/har/timings'
import { cn } from '@/lib/cn'

/** Horizontal bar with a 4px rounded data end, anchored at the baseline (dataviz mark spec). */
export function Meter({
  ratio,
  className,
  trackClassName,
}: {
  ratio: number
  className?: string
  trackClassName?: string
}) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-r-[4px] bg-chart-grid', trackClassName)}>
      <div className={cn('h-full rounded-r-[4px] bg-chart-series', className)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function LegendSwatch({ className }: { className: string }) {
  return <span className={cn('inline-block size-2 shrink-0 rounded-[2px]', className)} aria-hidden />
}

export function Legend({
  items,
  className,
}: {
  items: ReadonlyArray<{ label: ReactNode; swatch: string }>
  className?: string
}) {
  return (
    <ul
      className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground', className)}
    >
      {items.map((item, i) => (
        <li key={i} className="inline-flex items-center gap-1.5">
          <LegendSwatch className={item.swatch} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

export function PhaseLegend({ className }: { className?: string }) {
  return <Legend className={className} items={PHASES.map((p) => ({ label: p.label, swatch: p.swatch }))} />
}

interface StatTileProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'default' | 'danger' | 'warning'
}

export function StatTile({ label, value, hint, tone = 'default' }: StatTileProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border bg-panel px-4 py-3">
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          'truncate text-xl font-semibold tracking-tight',
          tone === 'danger' && 'text-danger',
          tone === 'warning' && 'text-warning',
        )}
      >
        {value}
      </span>
      {hint && <span className="truncate text-xs text-subtle-foreground">{hint}</span>}
    </div>
  )
}

export function Card({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('flex min-w-0 flex-col rounded-lg border bg-panel', className)}>
      <header className="flex min-h-11 items-center gap-3 border-b px-4 py-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[13px] font-semibold">{title}</h3>
          {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  )
}
