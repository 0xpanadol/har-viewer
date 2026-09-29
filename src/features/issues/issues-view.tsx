import { CircleCheck, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { SegmentedControl, SegmentedItem } from '@/components/ui/tabs'
import type { IssueSeverity } from '@/har/issues'
import { useAppStore } from '@/store'
import { selectIssues } from '@/store/selectors'
import { IssueCard } from './issue-card'
import { SEVERITY } from './severity'
import { pluralize } from '@/lib/format'

type SeverityFilter = 'all' | IssueSeverity

export function IssuesView() {
  const checks = useAppStore(selectIssues)
  const [filter, setFilter] = useState<SeverityFilter>('all')
  const failing = checks.filter((c) => c.items.length > 0)
  const passed = checks.filter((c) => c.items.length === 0)
  const shown = failing.filter((c) => filter === 'all' || c.severity === filter)
  const bySeverity = (s: IssueSeverity) =>
    failing.filter((c) => c.severity === s).reduce((n, c) => n + c.items.length, 0)
  const total = failing.reduce((n, c) => n + c.items.length, 0)

  return (
    <div className="@container h-full overflow-y-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4 @3xl:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Issues</h1>
            <p className="text-xs text-muted-foreground">
              {pluralize(total, 'finding')} across {pluralize(failing.length, 'check')} ·{' '}
              {pluralize(passed.length, 'check')} passed
            </p>
          </div>
          <SegmentedControl
            type="single"
            value={filter}
            onValueChange={(v) => v && setFilter(v as SeverityFilter)}
            aria-label="Severity"
          >
            <SegmentedItem value="all">All</SegmentedItem>
            {(['critical', 'warning', 'info'] as const).map((s) => {
              const Icon = SEVERITY[s].icon
              return (
                <SegmentedItem key={s} value={s}>
                  <Icon className={SEVERITY[s].tone} />
                  {SEVERITY[s].label} <span className="text-subtle-foreground tabular">{bySeverity(s)}</span>
                </SegmentedItem>
              )
            })}
          </SegmentedControl>
        </header>

        {failing.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck />}
            title="No issues found"
            description="Every automated check passed for this capture."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {shown.map((check) => (
              <IssueCard key={check.id} check={check} />
            ))}
            {!shown.length && (
              <p className="py-8 text-center text-xs text-muted-foreground">No {filter} issues.</p>
            )}
          </div>
        )}

        {passed.length > 0 && (
          <section className="rounded-lg border bg-panel p-4">
            <h2 className="mb-2 text-xs font-semibold text-muted-foreground">Passed checks</h2>
            <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {passed.map((check) => (
                <li key={check.id} className="flex items-start gap-2 text-xs">
                  <CircleCheck className="mt-px size-3.5 shrink-0 text-success" aria-label="Passed" />
                  <span>
                    <span className="font-medium">{check.title}</span>
                    <span className="text-muted-foreground"> — {check.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
