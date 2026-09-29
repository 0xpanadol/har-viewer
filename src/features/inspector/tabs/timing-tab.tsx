import { KeyValueList } from '@/components/key-value-list'
import { Section } from '@/components/section'
import { PHASES, phaseSegments } from '@/har/timings'
import type { Entry } from '@/har/types'
import { cn } from '@/lib/cn'
import { formatDuration, formatTimestamp } from '@/lib/format'
import { useAppStore } from '@/store'

/** DevTools-style breakdown: each phase is a bar positioned where it happened within the request. */
export function TimingTab({ entry }: { entry: Entry }) {
  const captureStart = useAppStore((s) => s.range.start)
  const segments = phaseSegments(entry)
  const total = segments.reduce((sum, s) => sum + s.duration, 0) || entry.time || 1

  return (
    <>
      <Section title="Request timing">
        <div className="flex flex-col gap-0.5 px-3" role="table" aria-label="Timing phases">
          {PHASES.map((phase) => {
            const segment = segments.find((s) => s.key === phase.key)
            return (
              <div
                key={phase.key}
                role="row"
                className="grid grid-cols-[112px_1fr_68px] items-center gap-3 py-1 text-xs"
                title={phase.description}
              >
                <span role="rowheader" className="flex items-center gap-2 text-muted-foreground">
                  <span className={cn('size-2 rounded-[2px]', phase.swatch)} aria-hidden />
                  {phase.label}
                </span>
                <span role="cell" className="relative h-2.5 rounded-sm bg-chart-grid">
                  {segment && (
                    <span
                      className={cn('absolute inset-y-0 rounded-[2px]', phase.swatch)}
                      style={{
                        left: `${(segment.offset / total) * 100}%`,
                        width: `max(2px, ${(segment.duration / total) * 100}%)`,
                      }}
                    />
                  )}
                </span>
                <span
                  role="cell"
                  className={cn(
                    'text-right font-mono tabular',
                    segment ? 'text-foreground' : 'text-subtle-foreground',
                  )}
                >
                  {segment ? formatDuration(segment.duration) : '—'}
                </span>
              </div>
            )
          })}
          <div
            role="row"
            className="mt-1 grid grid-cols-[112px_1fr_68px] items-center gap-3 border-t pt-2 text-xs font-medium"
          >
            <span role="rowheader">Total</span>
            <span />
            <span role="cell" className="text-right font-mono tabular">
              {formatDuration(entry.time)}
            </span>
          </div>
        </div>
      </Section>
      <Section title="When">
        <KeyValueList
          items={[
            { name: 'Started at', value: formatTimestamp(entry.raw.startedDateTime) },
            { name: 'After capture start', value: `+${formatDuration(entry.startTime - captureStart)}` },
            { name: 'Finished at', value: `+${formatDuration(entry.startTime - captureStart + entry.time)}` },
          ]}
        />
      </Section>
    </>
  )
}
