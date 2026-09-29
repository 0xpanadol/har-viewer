import { X } from 'lucide-react'
import { useRef, useState, type PointerEvent } from 'react'
import { Legend } from '@/components/charts'
import { STATUS_SERIES } from '@/components/status-colors'
import { histogram, type HistogramBucket } from '@/har/metrics'
import { useElementWidth } from '@/hooks/use-element-size'
import { cn } from '@/lib/cn'
import { formatDuration, pluralize } from '@/lib/format'
import { useAppStore } from '@/store'
import { useFilteredEntries } from '@/store/selectors'

const SERIES = STATUS_SERIES

const MIN_DRAG_PX = 4

function BucketTooltip({ bucket, left }: { bucket: HistogramBucket; left: number }) {
  return (
    <div
      className="pointer-events-none absolute bottom-full z-20 mb-2 w-max -translate-x-1/2 rounded-md bg-popover px-2.5 py-2 text-xs shadow-overlay"
      style={{ left }}
    >
      <p className="mb-1 font-medium tabular">
        {formatDuration(bucket.from)} – {formatDuration(bucket.to)}
      </p>
      <p className="mb-1 text-muted-foreground">{pluralize(bucket.total, 'request')} started</p>
      {SERIES.filter((s) => bucket.counts[s.key] > 0).map((s) => (
        <p key={s.key} className="flex items-center gap-1.5 tabular">
          <span className={cn('size-2 rounded-[2px]', s.swatch)} />
          <span className="text-muted-foreground">{s.label}</span>
          <span className="ml-auto pl-3">{bucket.counts[s.key]}</span>
        </p>
      ))}
    </div>
  )
}

export function TimeHistogram() {
  const entries = useFilteredEntries()
  const range = useAppStore((s) => s.range)
  const timeWindow = useAppStore((s) => s.timeWindow)
  const setTimeWindow = useAppStore((s) => s.setTimeWindow)
  const plotRef = useRef<HTMLDivElement>(null)
  const width = useElementWidth(plotRef)
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null)
  const [hover, setHover] = useState<number | null>(null)

  const duration = Math.max(1, range.end - range.start)
  const count = Math.min(160, Math.max(12, Math.floor(width / 7)))
  const buckets = histogram(entries, range.start, duration, count)
  const max = Math.max(1, ...buckets.map((b) => b.total))

  const fraction = (e: PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  }

  const onPointerDown = (e: PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const f = fraction(e)
    setDrag({ from: f, to: f })
  }
  const onPointerMove = (e: PointerEvent) => {
    const f = fraction(e)
    if (drag) setDrag({ ...drag, to: f })
    else setHover(Math.min(count - 1, Math.floor(f * count)))
  }
  const onPointerUp = () => {
    if (!drag) return
    const [a, b] = [Math.min(drag.from, drag.to), Math.max(drag.from, drag.to)]
    if ((b - a) * width < MIN_DRAG_PX) {
      const bucket = buckets[Math.min(count - 1, Math.floor(a * count))]
      if (bucket?.total) setTimeWindow([bucket.from, bucket.to])
    } else {
      setTimeWindow([a * duration, b * duration])
    }
    setDrag(null)
  }

  const windowFrac = timeWindow && ([timeWindow[0] / duration, timeWindow[1] / duration] as const)
  const hovered = hover !== null && !drag ? buckets[hover] : undefined

  return (
    <div className="shrink-0 border-b px-3 pt-2 pb-1.5">
      <div className="flex h-5 items-center gap-3 text-xs">
        <span className="font-medium">Requests over time</span>
        <Legend items={SERIES} className="hidden md:flex" />
        <span className="ml-auto text-subtle-foreground">
          {timeWindow ? null : 'Drag to zoom into a time range'}
        </span>
        {timeWindow && (
          <button
            type="button"
            onClick={() => setTimeWindow(null)}
            className="inline-flex h-5 items-center gap-1 rounded-md bg-primary/10 px-1.5 text-primary outline-none hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {formatDuration(timeWindow[0])} – {formatDuration(timeWindow[1])}
            <X className="size-3" />
          </button>
        )}
      </div>

      <div
        ref={plotRef}
        role="img"
        aria-label={`Histogram of ${pluralize(entries.length, 'request')} over ${formatDuration(duration)}. Drag to filter by start time.`}
        className="relative mt-1.5 h-11 cursor-crosshair touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setHover(null)}
      >
        <div className="absolute inset-0 flex items-end gap-[2px] border-b border-chart-grid">
          {buckets.map((bucket, i) => {
            const outside = windowFrac && ((i + 1) / count <= windowFrac[0] || i / count >= windowFrac[1])
            return (
              <div
                key={i}
                className={cn(
                  'flex h-full min-w-0 flex-1 flex-col justify-end',
                  outside && 'opacity-30',
                  hover === i && !drag && 'opacity-80',
                )}
              >
                <div
                  className="flex flex-col-reverse gap-px overflow-hidden rounded-t-[2px]"
                  style={{ height: `${(bucket.total / max) * 100}%` }}
                >
                  {SERIES.map(
                    (s) =>
                      bucket.counts[s.key] > 0 && (
                        <span
                          key={s.key}
                          className={cn('min-h-px', s.swatch)}
                          style={{ flexGrow: bucket.counts[s.key] }}
                        />
                      ),
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {drag && (
          <div
            className="absolute inset-y-0 border-x border-primary bg-primary/10"
            style={{
              left: `${Math.min(drag.from, drag.to) * 100}%`,
              width: `${Math.abs(drag.to - drag.from) * 100}%`,
            }}
          />
        )}
        {hovered && hover !== null && (
          <BucketTooltip bucket={hovered} left={((hover + 0.5) / count) * width} />
        )}
      </div>

      <div className="mt-1 flex justify-between font-mono text-2xs text-subtle-foreground tabular">
        <span>0</span>
        <span>{formatDuration(duration / 2)}</span>
        <span>{formatDuration(duration)}</span>
      </div>
    </div>
  )
}
