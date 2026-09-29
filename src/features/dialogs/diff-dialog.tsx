import { MethodLabel, StatusCode } from '@/components/http-labels'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { diffHeaders, type HeaderDelta } from '@/har/compare'
import { responseText } from '@/har/decode'
import type { Entry } from '@/har/types'
import { cn } from '@/lib/cn'
import { formatBytes, formatDuration } from '@/lib/format'
import { useAppStore } from '@/store'
import { selectEntryMap } from '@/store/selectors'

const BODY_PREVIEW = 20_000

function Side({ entry, label }: { entry: Entry; label: string }) {
  return (
    <div className="min-w-0 rounded-lg border bg-panel p-3">
      <p className="mb-1.5 text-2xs font-medium tracking-wide text-subtle-foreground uppercase">
        {label} · #{entry.id + 1}
      </p>
      <div className="flex items-center gap-2">
        <MethodLabel method={entry.method} />
        <StatusCode status={entry.status} statusText={entry.statusText} />
      </div>
      <p className="mt-1.5 line-clamp-2 font-mono text-xs break-all">{entry.url}</p>
      <p className="mt-1.5 text-xs text-muted-foreground tabular">
        {formatDuration(entry.time)} · {formatBytes(entry.size)} · {entry.type}
      </p>
    </div>
  )
}

function HeaderDiffTable({ deltas }: { deltas: HeaderDelta[] }) {
  if (!deltas.length)
    return <p className="py-8 text-center text-xs text-muted-foreground">Headers are identical.</p>
  return (
    <table className="w-full table-fixed font-mono text-xs">
      <thead className="text-left font-sans text-muted-foreground">
        <tr className="border-b">
          <th className="w-1/4 py-2 pr-3 font-medium">Header</th>
          <th className="py-2 pr-3 font-medium">A</th>
          <th className="py-2 font-medium">B</th>
        </tr>
      </thead>
      <tbody>
        {deltas.map((d) => (
          <tr key={d.name} className="border-b border-border/60 align-top last:border-0">
            <td className="truncate py-1.5 pr-3 text-muted-foreground" title={d.name}>
              {d.name}
            </td>
            <td
              className={cn(
                'py-1.5 pr-3 break-all',
                d.before === undefined
                  ? 'text-subtle-foreground italic'
                  : d.after === undefined && 'bg-danger/8 text-danger',
              )}
            >
              {d.before ?? 'absent'}
            </td>
            <td
              className={cn(
                'py-1.5 break-all',
                d.after === undefined ? 'text-subtle-foreground italic' : 'bg-success/8 text-success',
              )}
            >
              {d.after ?? 'absent'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BodyPane({ entry }: { entry: Entry }) {
  const text = responseText(entry.raw.response?.content)
  return (
    <pre className="max-h-[50vh] min-w-0 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs break-all whitespace-pre-wrap">
      {text ? text.slice(0, BODY_PREVIEW) : <span className="text-subtle-foreground">(no body)</span>}
      {text.length > BODY_PREVIEW && (
        <span className="text-subtle-foreground">{`\n… ${formatBytes(text.length)} total`}</span>
      )}
    </pre>
  )
}

export function DiffDialog() {
  const closeDialog = useAppStore((s) => s.closeDialog)
  const ids = useAppStore((s) => (s.dialog.type === 'diff' ? s.dialog.ids : null))
  const entryMap = useAppStore(selectEntryMap)
  const a = ids && entryMap.get(ids[0])
  const b = ids && entryMap.get(ids[1])
  const pair = a && b ? ([a, b] as const) : null

  const requestDeltas = pair ? diffHeaders(pair[0].raw.request?.headers, pair[1].raw.request?.headers) : []
  const responseDeltas = pair ? diffHeaders(pair[0].raw.response?.headers, pair[1].raw.response?.headers) : []

  return (
    <Dialog open={pair !== null} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="top-[6vh] max-h-[88vh] max-w-5xl">
        {pair && (
          <>
            <DialogHeader>
              <DialogTitle>
                Diff #{pair[0].id + 1} ↔ #{pair[1].id + 1}
              </DialogTitle>
              <DialogDescription>Header differences and response bodies side by side.</DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Side entry={pair[0]} label="A" />
                <Side entry={pair[1]} label="B" />
              </div>
              <Tabs defaultValue="response-headers">
                <TabsList className="border-b">
                  <TabsTrigger value="response-headers">
                    Response headers{' '}
                    <span className="text-subtle-foreground tabular">{responseDeltas.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="request-headers">
                    Request headers{' '}
                    <span className="text-subtle-foreground tabular">{requestDeltas.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="body">Response body</TabsTrigger>
                </TabsList>
                <TabsContent value="response-headers" className="pt-2 outline-none">
                  <HeaderDiffTable deltas={responseDeltas} />
                </TabsContent>
                <TabsContent value="request-headers" className="pt-2 outline-none">
                  <HeaderDiffTable deltas={requestDeltas} />
                </TabsContent>
                <TabsContent value="body" className="grid gap-3 pt-3 outline-none md:grid-cols-2">
                  <BodyPane entry={pair[0]} />
                  <BodyPane entry={pair[1]} />
                </TabsContent>
              </Tabs>
            </DialogBody>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
