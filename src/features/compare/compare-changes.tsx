import { Minus, Plus } from 'lucide-react'
import { MethodLabel } from '@/components/http-labels'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CaptureDiff } from '@/har/compare'
import type { Entry } from '@/har/types'
import { cn } from '@/lib/cn'
import { formatBytes, formatDelta, formatDuration } from '@/lib/format'

const LIMIT = 200

function EndpointList({ entries, kind }: { entries: Entry[]; kind: 'added' | 'removed' }) {
  if (!entries.length)
    return <p className="px-4 py-6 text-center text-xs text-muted-foreground">Nothing {kind}.</p>
  const Icon = kind === 'added' ? Plus : Minus
  return (
    <ul>
      {entries.slice(0, LIMIT).map((e) => (
        <li
          key={e.id}
          className="grid grid-cols-[16px_52px_1fr_auto] items-center gap-3 border-b border-border/60 px-4 py-1.5 text-xs last:border-0"
        >
          <Icon
            className={cn('size-3.5', kind === 'added' ? 'text-success' : 'text-danger')}
            aria-label={kind}
          />
          <MethodLabel method={e.method} />
          <span className="truncate font-mono" title={e.url}>
            <span className="text-subtle-foreground">{e.host}</span>
            {e.path.split('?')[0]}
          </span>
          <span className="text-muted-foreground tabular">{formatDuration(e.time)}</span>
        </li>
      ))}
    </ul>
  )
}

export function CompareChanges({ diff }: { diff: CaptureDiff }) {
  return (
    <Tabs defaultValue="changed" className="rounded-lg border bg-panel">
      <TabsList className="border-b px-4">
        <TabsTrigger value="changed">
          Changed <span className="text-subtle-foreground tabular">{diff.changed.length}</span>
        </TabsTrigger>
        <TabsTrigger value="added">
          New <span className="text-subtle-foreground tabular">{diff.added.length}</span>
        </TabsTrigger>
        <TabsTrigger value="removed">
          Removed <span className="text-subtle-foreground tabular">{diff.removed.length}</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="changed" className="outline-none">
        {!diff.changed.length && (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            No endpoint changed by more than 50 ms or 512 bytes.
          </p>
        )}
        <ul>
          {diff.changed.slice(0, LIMIT).map((c) => (
            <li
              key={c.key}
              className="grid grid-cols-[52px_1fr_auto_auto] items-center gap-3 border-b border-border/60 px-4 py-1.5 text-xs last:border-0"
            >
              <MethodLabel method={c.after.method} />
              <span className="truncate font-mono" title={c.after.url}>
                {c.after.path.split('?')[0]}
              </span>
              <span
                className={cn('w-24 text-right tabular', c.timeDelta > 0 ? 'text-danger' : 'text-success')}
              >
                {formatDelta(c.timeDelta, formatDuration)}
              </span>
              <span
                className={cn(
                  'w-24 text-right tabular',
                  c.sizeDelta > 0
                    ? 'text-warning'
                    : c.sizeDelta < 0
                      ? 'text-success'
                      : 'text-subtle-foreground',
                )}
              >
                {formatDelta(c.sizeDelta, formatBytes)}
              </span>
            </li>
          ))}
        </ul>
      </TabsContent>
      <TabsContent value="added" className="outline-none">
        <EndpointList entries={diff.added} kind="added" />
      </TabsContent>
      <TabsContent value="removed" className="outline-none">
        <EndpointList entries={diff.removed} kind="removed" />
      </TabsContent>
    </Tabs>
  )
}
