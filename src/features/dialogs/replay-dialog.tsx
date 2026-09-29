import { CircleX, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CopyButton } from '@/components/copy-button'
import { StatusCode } from '@/components/http-labels'
import { Section } from '@/components/section'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Entry } from '@/har/types'
import { formatDuration } from '@/lib/format'
import { replayRequest, type ReplayResult } from '@/services/replay'
import { useAppStore } from '@/store'
import { selectEntryMap } from '@/store/selectors'

type ReplayState =
  { status: 'loading' } | { status: 'done'; result: ReplayResult } | { status: 'error'; message: string }

function ReplayBody({ entry }: { entry: Entry }) {
  const [state, setState] = useState<ReplayState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    replayRequest(entry, controller.signal)
      .then((result) => setState({ status: 'done', result }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', message: error instanceof Error ? error.message : String(error) })
      })
    return () => controller.abort()
  }, [entry])

  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-xs text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" /> Sending request…
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <CircleX className="size-5 text-danger" />
        <p className="text-[13px] font-medium">The request didn’t go through</p>
        <p className="max-w-md text-xs text-muted-foreground">
          {state.message}. Browsers block cross-origin replays unless the server allows this page’s origin via
          CORS — copy the request as cURL to run it from a terminal instead.
        </p>
      </div>
    )
  }

  const { result } = state
  return (
    <div className="-mx-5 -my-4">
      <div className="flex items-center gap-3 border-b px-5 py-3 text-xs">
        <StatusCode status={result.status} statusText={result.statusText} className="text-[13px]" />
        <span className="text-muted-foreground tabular">{formatDuration(result.durationMs)}</span>
        <span className="ml-auto text-muted-foreground">Original: {entry.status}</span>
      </div>
      <Section title="Response headers" count={result.headers.length} defaultOpen={false}>
        <dl className="grid grid-cols-[minmax(96px,34%)_1fr] gap-y-1 px-3 font-mono text-xs">
          {result.headers.map(([name, value]) => (
            <div key={name} className="contents">
              <dt className="truncate text-muted-foreground">{name}</dt>
              <dd className="break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section title="Body" actions={<CopyButton value={result.body} label="Copy body" />}>
        <pre className="mx-3 max-h-[40vh] overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs break-all whitespace-pre-wrap">
          {result.body || '(empty)'}
        </pre>
      </Section>
    </div>
  )
}

export function ReplayDialog() {
  const closeDialog = useAppStore((s) => s.closeDialog)
  const entry = useAppStore((s) =>
    s.dialog.type === 'replay' ? selectEntryMap(s).get(s.dialog.entryId) : undefined,
  )

  return (
    <Dialog open={!!entry} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-w-2xl">
        {entry && (
          <>
            <DialogHeader>
              <DialogTitle>Replay request</DialogTitle>
              <DialogDescription className="truncate font-mono">
                {entry.method} {entry.url}
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <ReplayBody entry={entry} />
            </DialogBody>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
