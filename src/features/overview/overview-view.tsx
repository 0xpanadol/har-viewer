import { StatTile } from '@/components/charts'
import { profilePerformance, summarize, topBy } from '@/har/metrics'
import { formatBytes, formatDuration, formatNumber, formatPercent, formatTimestamp } from '@/lib/format'
import { useAppStore } from '@/store'
import { BreakdownCard } from './breakdown-card'
import { ContentTypeCard, StatusCard } from './distribution-cards'
import { CachingCard, ProtocolCard, TimingCard, TopRequestsCard } from './performance-cards'

export function OverviewView() {
  const entries = useAppStore((s) => s.entries)
  const log = useAppStore((s) => s.log)
  const fileName = useAppStore((s) => s.fileName)
  const summary = summarize(entries, log)
  const profile = profilePerformance(entries)
  const started = log?.pages?.[0]?.startedDateTime ?? entries[0]?.raw.startedDateTime

  return (
    <div className="@container h-full overflow-y-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 @3xl:p-6">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Overview</h1>
            <p className="text-xs text-muted-foreground">
              {fileName} · captured {formatTimestamp(started)}
              {log?.creator && ` · ${log.creator.name} ${log.creator.version}`}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-3 @6xl:grid-cols-6">
          <StatTile
            label="Requests"
            value={formatNumber(summary.requests)}
            hint={`${formatNumber(summary.domains)} domains`}
          />
          <StatTile
            label="Transferred"
            value={formatBytes(summary.transferredBytes)}
            hint={`${formatBytes(summary.contentBytes)} resources`}
          />
          <StatTile label="Finish" value={formatDuration(summary.finish)} hint="First start to last byte" />
          <StatTile
            label="DOMContentLoaded"
            value={formatDuration(summary.domContentLoaded)}
            hint={summary.domContentLoaded ? 'From page timings' : 'Not recorded'}
          />
          <StatTile
            label="Load"
            value={formatDuration(summary.load)}
            hint={summary.load ? 'From page timings' : 'Not recorded'}
          />
          <StatTile
            label="Failed"
            value={formatNumber(summary.errors)}
            hint={
              summary.requests
                ? `${formatPercent(summary.errors / summary.requests, 1)} of requests`
                : undefined
            }
            tone={summary.errors ? 'danger' : 'default'}
          />
        </div>

        <div className="grid gap-4 @4xl:grid-cols-2">
          <StatusCard entries={entries} />
          <ContentTypeCard entries={entries} />
        </div>

        <BreakdownCard entries={entries} />

        <div className="grid gap-4 @4xl:grid-cols-2 @6xl:grid-cols-3">
          <TimingCard profile={profile} />
          <CachingCard profile={profile} />
          <ProtocolCard profile={profile} total={entries.length} />
        </div>

        <div className="grid gap-4 @4xl:grid-cols-2">
          <TopRequestsCard
            title="Slowest requests"
            entries={topBy(entries, (e) => e.time, 6)}
            metric={(e) => formatDuration(e.time)}
          />
          <TopRequestsCard
            title="Largest responses"
            entries={topBy(entries, (e) => e.size, 6)}
            metric={(e) => formatBytes(e.size)}
          />
        </div>
      </div>
    </div>
  )
}
