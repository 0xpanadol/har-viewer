import { StatusCode } from '@/components/http-labels'
import { phaseSegments } from '@/har/timings'
import type { Entry } from '@/har/types'
import { cn } from '@/lib/cn'
import { formatBytes, formatDuration } from '@/lib/format'

/** Pointer-following card with the full phase breakdown for one request. */
export function PhaseTooltip({
  entry,
  x,
  y,
  captureStart,
}: {
  entry: Entry
  x: number
  y: number
  captureStart: number
}) {
  const segments = phaseSegments(entry)
  const left = Math.min(x + 14, window.innerWidth - 300)
  const top = Math.min(y + 14, window.innerHeight - 60 - segments.length * 20)
  return (
    <div
      className="pointer-events-none fixed z-50 w-72 rounded-lg bg-popover p-3 text-xs shadow-overlay"
      style={{ left, top }}
    >
      <p className="mb-2 line-clamp-2 font-mono break-all">
        <span className="text-subtle-foreground">{entry.host}</span>
        {entry.path}
      </p>
      <div className="mb-2 flex items-center gap-3 text-muted-foreground">
        <StatusCode status={entry.status} />
        <span className="tabular">{formatDuration(entry.time)}</span>
        <span className="tabular">{formatBytes(entry.size)}</span>
        <span className="ml-auto tabular">+{formatDuration(entry.startTime - captureStart)}</span>
      </div>
      <ul className="flex flex-col gap-1 border-t pt-2">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className={cn('size-2 rounded-[2px]', s.swatch)} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-mono tabular">{formatDuration(s.duration)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
