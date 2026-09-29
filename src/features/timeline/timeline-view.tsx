import { SearchX } from 'lucide-react'
import { useState } from 'react'
import { Legend } from '@/components/charts'
import { TimeAxisLabels, TimeGridLines } from '@/components/time-axis'
import { EmptyState } from '@/components/ui/empty-state'
import type { Entry } from '@/har/types'
import { cn } from '@/lib/cn'
import { pluralize } from '@/lib/format'
import { niceTicks } from '@/lib/ticks'
import { useAppStore } from '@/store'
import { useVisibleEntries } from '@/store/selectors'
import { FilterToolbar } from '../filters/filter-toolbar'
import { PhaseTooltip } from '../waterfall/phase-tooltip'
import { packLanes } from './pack-lanes'

const BAR = 8
const GAP = 2
const LABEL_WIDTH = 240

const barTone = (e: Entry) =>
  e.status === 0 || e.status >= 500
    ? 'bg-chart-critical'
    : e.status >= 400
      ? 'bg-chart-warning'
      : 'bg-chart-series'

const LEGEND = [
  { label: 'Success / redirect', swatch: 'bg-chart-series' },
  { label: '4xx', swatch: 'bg-chart-warning' },
  { label: '5xx / failed', swatch: 'bg-chart-critical' },
]

export function TimelineView() {
  const entries = useVisibleEntries()
  const range = useAppStore((s) => s.range)
  const selectedId = useAppStore((s) => s.selectedId)
  const [hover, setHover] = useState<{ entry: Entry; x: number; y: number } | null>(null)

  const lanes = packLanes(entries)
  const duration = Math.max(1, range.end - range.start)
  const ticks = niceTicks(duration, 8)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <FilterToolbar />
      <div className="flex shrink-0 items-center gap-4 border-b px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Each lane is a domain; stacked bars are requests in flight at the same time.
        </p>
        <Legend items={LEGEND} className="ml-auto" />
      </div>
      {!entries.length ? (
        <EmptyState
          icon={<SearchX />}
          title="No requests match"
          description="Adjust the filters to see the timeline."
          className="flex-1"
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto" onMouseLeave={() => setHover(null)}>
          <div className="sticky top-0 z-10 flex h-8 border-b bg-panel text-xs text-muted-foreground">
            <div
              className="flex shrink-0 items-center border-r px-3 font-medium"
              style={{ width: LABEL_WIDTH }}
            >
              Domain
            </div>
            <div className="relative mx-3 flex-1">
              <TimeAxisLabels ticks={ticks} duration={duration} />
            </div>
          </div>
          {lanes.map((lane) => (
            <div key={lane.host} className="flex border-b border-border/60">
              <div
                className="flex shrink-0 flex-col justify-center gap-0.5 border-r px-3 py-2"
                style={{ width: LABEL_WIDTH }}
              >
                <span className="truncate font-mono text-xs" title={lane.host}>
                  {lane.host || '(no host)'}
                </span>
                <span className="text-2xs text-subtle-foreground tabular">
                  {pluralize(lane.count, 'request')}
                  {lane.errors > 0 && <span className="text-danger"> · {lane.errors} failed</span>}
                </span>
              </div>
              <div
                className="relative mx-3 flex-1 py-2"
                style={{ height: lane.rows.length * (BAR + GAP) + 16 }}
              >
                <TimeGridLines ticks={ticks} duration={duration} />
                {lane.rows.map((row, r) =>
                  row.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      aria-label={`${entry.method} ${entry.url}`}
                      onClick={() => useAppStore.getState().inspect(entry.id, 'timing')}
                      onMouseMove={(e) => setHover({ entry, x: e.clientX, y: e.clientY })}
                      className={cn(
                        'absolute rounded-l-[1px] rounded-r-[3px] outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring',
                        barTone(entry),
                        entry.id === selectedId && 'ring-2 ring-foreground',
                      )}
                      style={{
                        top: 8 + r * (BAR + GAP),
                        height: BAR,
                        left: `${((entry.startTime - range.start) / duration) * 100}%`,
                        width: `max(3px, ${(entry.time / duration) * 100}%)`,
                      }}
                    />
                  )),
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {hover && <PhaseTooltip entry={hover.entry} x={hover.x} y={hover.y} captureStart={range.start} />}
    </div>
  )
}
