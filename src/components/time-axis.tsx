import { formatTick } from '@/lib/format'

interface TimeAxisProps {
  ticks: readonly number[]
  duration: number
}

/** Tick labels for a horizontal time scale (0 → duration). */
export function TimeAxisLabels({ ticks, duration }: TimeAxisProps) {
  return ticks.map((t) => (
    <span
      key={t}
      className="absolute top-1/2 -translate-y-1/2 font-mono text-2xs whitespace-nowrap tabular not-first:-translate-x-1/2"
      style={{ left: `${(t / duration) * 100}%` }}
    >
      {formatTick(t)}
    </span>
  ))
}

/** Hairline gridlines matching the labels (dataviz spec: 1px, solid, recessive). */
export function TimeGridLines({ ticks, duration }: TimeAxisProps) {
  return ticks.map((t) => (
    <div
      key={t}
      className="absolute inset-y-0 w-px bg-chart-grid"
      style={{ left: `${(t / duration) * 100}%` }}
    />
  ))
}
