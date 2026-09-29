import type { ReactNode } from 'react'
import { Card, Meter, PhaseLegend } from '@/components/charts'
import { MethodLabel, StatusCode } from '@/components/http-labels'
import type { PerformanceProfile } from '@/har/metrics'
import type { Entry } from '@/har/types'
import { cn } from '@/lib/cn'
import { formatBytes, formatDuration, formatNumber, formatPercent } from '@/lib/format'
import { useAppStore } from '@/store'

function Row({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-border/60 py-1.5 text-xs first:border-0">
      <span className="text-muted-foreground" title={hint}>
        {label}
      </span>
      <span className="tabular">{value}</span>
    </div>
  )
}

export function TimingCard({ profile }: { profile: PerformanceProfile }) {
  const phases = profile.avgPhases.filter((p) => p.avg > 0)
  const total = phases.reduce((sum, p) => sum + p.avg, 0) || 1
  return (
    <Card title="Average timing" description={`${formatDuration(total)} per request, by phase`}>
      <div className="flex flex-col gap-3 p-4">
        <div
          className="flex h-3 w-full gap-[2px] overflow-hidden rounded-[4px]"
          role="img"
          aria-label="Average time per phase"
        >
          {phases.map((p) => (
            <span
              key={p.key}
              className={cn('h-full', p.swatch)}
              style={{ flexGrow: p.avg }}
              title={`${p.label}: ${formatDuration(p.avg)}`}
            />
          ))}
        </div>
        <PhaseLegend />
        <div>
          {profile.avgPhases.map((p) => (
            <Row
              key={p.key}
              label={p.label}
              value={p.avg > 0 ? `${formatDuration(p.avg)} · ${formatPercent(p.avg / total)}` : '—'}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

export function CachingCard({ profile }: { profile: PerformanceProfile }) {
  return (
    <Card title="Caching & compression">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Cache hit ratio (304s)</span>
            <span className="text-base font-semibold tabular">{formatPercent(profile.cacheHitRatio, 1)}</span>
          </div>
          <Meter ratio={profile.cacheHitRatio} />
        </div>
        <div>
          <Row label="Revalidated (304)" value={formatNumber(profile.cached)} />
          <Row label="Fresh (2xx–3xx)" value={formatNumber(profile.fresh)} />
          <Row
            label="Compressed responses"
            value={`${formatNumber(profile.compressed)} of ${formatNumber(profile.compressed + profile.uncompressed)}`}
          />
          <Row
            label="Compression savings"
            value={
              profile.decodedBytes
                ? `${formatPercent(profile.compressionSavings, 1)} · ${formatBytes(profile.decodedBytes - profile.wireBytes)}`
                : '—'
            }
            hint="Decoded size vs bytes on the wire for compressed responses"
          />
        </div>
      </div>
    </Card>
  )
}

export function ProtocolCard({ profile, total }: { profile: PerformanceProfile; total: number }) {
  return (
    <Card title="Protocol & network">
      <div className="flex flex-col gap-3 p-4">
        <ul className="flex flex-col gap-2">
          {profile.httpVersions.map((v) => (
            <li key={v.version} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 text-xs">
              <span className="font-mono">{v.version}</span>
              <Meter ratio={v.count / (total || 1)} />
              <span className="w-10 text-right tabular">{formatNumber(v.count)}</span>
            </li>
          ))}
        </ul>
        <div>
          <Row label="CORS preflights (OPTIONS)" value={formatNumber(profile.preflights)} />
          <Row label="Redirects" value={formatNumber(profile.redirects)} />
          <Row
            label="Distinct connections"
            value={profile.connections ? formatNumber(profile.connections) : '—'}
          />
        </div>
      </div>
    </Card>
  )
}

export function TopRequestsCard({
  title,
  entries,
  metric,
}: {
  title: string
  entries: Entry[]
  metric: (e: Entry) => string
}) {
  const inspect = useAppStore((s) => s.inspect)
  return (
    <Card title={title}>
      <ul className="py-1">
        {entries.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => inspect(e.id)}
              className="grid w-full grid-cols-[52px_1fr_auto] items-center gap-3 px-4 py-1.5 text-left text-xs outline-none hover:bg-muted/60 focus-visible:bg-muted"
            >
              <MethodLabel method={e.method} />
              <span className="truncate font-mono" title={e.url}>
                <span className="text-subtle-foreground">{e.host}</span>
                {e.path}
              </span>
              <span className="flex items-center gap-3">
                <StatusCode status={e.status} />
                <span className="w-16 text-right font-medium tabular">{metric(e)}</span>
              </span>
            </button>
          </li>
        ))}
        {!entries.length && <li className="px-4 py-3 text-xs text-muted-foreground">Nothing to show</li>}
      </ul>
    </Card>
  )
}
