import { useVirtualizer } from '@tanstack/react-virtual'
import { SearchX } from 'lucide-react'
import { useRef, useState } from 'react'
import { PhaseLegend } from '@/components/charts'
import { MethodLabel } from '@/components/http-labels'
import { STATUS_DOT } from '@/components/status-colors'
import { TimeAxisLabels, TimeGridLines } from '@/components/time-axis'
import { EmptyState } from '@/components/ui/empty-state'
import { statusGroup } from '@/har/parse'
import { phaseSegments } from '@/har/timings'
import type { Entry } from '@/har/types'
import { cn } from '@/lib/cn'
import { formatDuration } from '@/lib/format'
import { niceTicks } from '@/lib/ticks'
import { useAppStore } from '@/store'
import { useVisibleEntries } from '@/store/selectors'
import { FilterToolbar } from '../filters/filter-toolbar'
import { PhaseTooltip } from './phase-tooltip'

const ROW = 28
const LABEL_WIDTH = 300

function PageMarker({
  at,
  duration,
  label,
  className,
}: {
  at: number | undefined
  duration: number
  label: string
  className: string
}) {
  if (!at || at <= 0 || at > duration) return null
  return (
    <div
      className={cn('pointer-events-none absolute inset-y-0 w-px', className)}
      style={{ left: `${(at / duration) * 100}%` }}
      title={`${label} ${formatDuration(at)}`}
    />
  )
}

function WaterfallChart({ entries }: { entries: Entry[] }) {
  const range = useAppStore((s) => s.range)
  const selectedId = useAppStore((s) => s.selectedId)
  const pageTimings = useAppStore((s) => s.log?.pages?.[0]?.pageTimings)
  const pageStart = useAppStore((s) => Date.parse(s.log?.pages?.[0]?.startedDateTime ?? '') || s.range.start)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<{ entry: Entry; x: number; y: number } | null>(null)

  const duration = Math.max(1, range.end - range.start)
  const ticks = niceTicks(duration, 8)
  const pageOffset = pageStart - range.start
  const dcl = pageTimings?.onContentLoad !== undefined ? pageTimings.onContentLoad + pageOffset : undefined
  const load = pageTimings?.onLoad !== undefined ? pageTimings.onLoad + pageOffset : undefined

  // TanStack Virtual is opaque to the React Compiler; this component opts out of compilation.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW,
    overscan: 10,
  })

  const grid = (
    <>
      <TimeGridLines ticks={ticks} duration={duration} />
      <PageMarker at={dcl} duration={duration} label="DOMContentLoaded" className="bg-info" />
      <PageMarker at={load} duration={duration} label="Load" className="bg-danger" />
    </>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-8 shrink-0 border-b bg-panel text-xs text-muted-foreground">
        <div className="flex shrink-0 items-center border-r px-3 font-medium" style={{ width: LABEL_WIDTH }}>
          Request
        </div>
        <div className="relative mx-3 flex-1">
          <TimeAxisLabels ticks={ticks} duration={duration} />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 overflow-y-auto"
        onMouseLeave={() => setHover(null)}
      >
        <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
          <div className="pointer-events-none absolute inset-y-0 right-3" style={{ left: LABEL_WIDTH + 12 }}>
            {grid}
          </div>
          {virtualizer.getVirtualItems().map((item) => {
            const entry = entries[item.index]!
            const segments = phaseSegments(entry)
            const total = segments.reduce((sum, s) => sum + s.duration, 0) || 1
            const left = ((entry.startTime - range.start) / duration) * 100
            const width = (entry.time / duration) * 100
            const name = entry.path.split('?')[0]!.split('/').filter(Boolean).pop() || entry.host
            return (
              <div
                key={entry.id}
                role="button"
                tabIndex={-1}
                onClick={() => useAppStore.getState().inspect(entry.id, 'timing')}
                onMouseMove={(e) => setHover({ entry, x: e.clientX, y: e.clientY })}
                className={cn(
                  'absolute inset-x-0 top-0 flex cursor-default items-center border-b border-border/40 hover:bg-muted/50',
                  entry.id === selectedId && 'bg-selection-strong',
                )}
                style={{ height: ROW, transform: `translateY(${item.start}px)` }}
              >
                <div
                  className="flex shrink-0 items-center gap-2 border-r px-3 text-xs"
                  style={{ width: LABEL_WIDTH }}
                >
                  <span
                    className={cn('size-1.5 shrink-0 rounded-full', STATUS_DOT[statusGroup(entry.status)])}
                  />
                  <MethodLabel method={entry.method} className="w-12 shrink-0 text-2xs" />
                  <span className="truncate font-mono" title={entry.url}>
                    {name}
                  </span>
                </div>
                <div className="relative mx-3 h-full flex-1">
                  <div
                    className="absolute top-1/2 flex h-3 -translate-y-1/2 items-center gap-px"
                    style={{ left: `${left}%`, width: `max(2px, ${width}%)` }}
                  >
                    {segments.map((s) => (
                      <span
                        key={s.key}
                        className={cn('h-full min-w-px first:rounded-l-[2px] last:rounded-r-[4px]', s.swatch)}
                        style={{ flexGrow: s.duration / total }}
                      />
                    ))}
                    <span className="absolute left-full pl-1.5 font-mono text-2xs whitespace-nowrap text-muted-foreground tabular">
                      {formatDuration(entry.time)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {hover && <PhaseTooltip entry={hover.entry} x={hover.x} y={hover.y} captureStart={range.start} />}
    </div>
  )
}

export function WaterfallView() {
  const entries = useVisibleEntries()
  return (
    <div className="flex h-full min-h-0 flex-col">
      <FilterToolbar />
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b px-3 py-2">
        <PhaseLegend />
        <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-px bg-info" /> DOMContentLoaded
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-px bg-danger" /> Load
          </span>
        </span>
      </div>
      {entries.length ? (
        <WaterfallChart entries={entries} />
      ) : (
        <EmptyState
          icon={<SearchX />}
          title="No requests match"
          description="Adjust the filters to see the waterfall."
          className="flex-1"
        />
      )}
    </div>
  )
}
