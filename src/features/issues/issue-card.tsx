import { ChevronRight } from 'lucide-react'
import { Collapsible } from 'radix-ui'
import { useState } from 'react'
import { MethodLabel, StatusCode } from '@/components/http-labels'
import type { IssueCheck, IssueItem } from '@/har/issues'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store'
import { SEVERITY } from './severity'

const PAGE = 25

function ItemRow({ item }: { item: IssueItem }) {
  const inspect = useAppStore((s) => s.inspect)
  const [first] = item.entries
  if (!first) return null
  const chain = item.entries.length > 1 && item.metric.includes('hop')

  return (
    <li className="border-t border-border/60">
      <button
        type="button"
        onClick={() => inspect(first.id)}
        className="grid w-full grid-cols-[52px_64px_1fr_auto] items-center gap-3 px-4 py-1.5 text-left text-xs outline-none hover:bg-muted/60 focus-visible:bg-muted"
      >
        <MethodLabel method={first.method} />
        <StatusCode status={first.status} />
        <span className="truncate font-mono" title={first.url}>
          <span className="text-subtle-foreground">{first.host}</span>
          {first.path}
        </span>
        <span className="font-mono font-medium tabular">{item.metric}</span>
      </button>
      {chain && (
        <ol className="mb-1.5 ml-[calc(116px+1.5rem+1rem)] flex flex-col border-l pl-3">
          {item.entries.slice(1).map((hop) => (
            <li key={hop.id}>
              <button
                type="button"
                onClick={() => inspect(hop.id)}
                className="flex w-full items-center gap-2 py-0.5 text-left text-xs outline-none hover:text-foreground"
              >
                <span className="text-subtle-foreground">→</span>
                <StatusCode status={hop.status} />
                <span className="truncate font-mono text-muted-foreground">{hop.url}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </li>
  )
}

export function IssueCard({ check }: { check: IssueCheck }) {
  const [limit, setLimit] = useState(PAGE)
  const severity = SEVERITY[check.severity]

  return (
    <Collapsible.Root
      defaultOpen={check.severity === 'critical' || check.items.length <= 8}
      className="group/issue overflow-hidden rounded-lg border bg-panel"
    >
      <Collapsible.Trigger className="flex w-full cursor-default items-start gap-3 px-4 py-3 text-left outline-none hover:bg-muted/40 focus-visible:bg-muted">
        <severity.icon className={cn('mt-0.5 size-4 shrink-0', severity.tone)} aria-label={severity.label} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-[13px] font-semibold">{check.title}</span>
            <span className="rounded-md bg-muted px-1.5 text-xs text-muted-foreground tabular">
              {check.items.length}
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{check.description}</span>
        </span>
        <ChevronRight className="mt-0.5 size-4 shrink-0 text-subtle-foreground transition-transform group-data-[state=open]/issue:rotate-90" />
      </Collapsible.Trigger>
      <Collapsible.Content>
        <ul>
          {check.items.slice(0, limit).map((item, i) => (
            <ItemRow key={`${item.entries[0]?.id}-${i}`} item={item} />
          ))}
        </ul>
        {check.items.length > limit && (
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE)}
            className="w-full border-t px-4 py-2 text-left text-xs text-primary outline-none hover:bg-muted/60"
          >
            Show {Math.min(PAGE, check.items.length - limit)} more
          </button>
        )}
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
