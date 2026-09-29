import { ArrowDown, ArrowUp } from 'lucide-react'
import { useState } from 'react'
import { matchesQuery, MIN_QUERY, useFindQuery } from '@/components/find-query'
import { Highlight } from '@/components/highlight'
import { SegmentedControl, SegmentedItem } from '@/components/ui/tabs'
import { prettyJson, tryParseJson } from '@/har/decode'
import type { Entry, WebSocketMessage } from '@/har/types'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/format'

type Direction = 'all' | 'send' | 'receive'

function MessageRow({ message, start }: { message: WebSocketMessage; start: number }) {
  const [open, setOpen] = useState(false)
  const json = tryParseJson(message.data)
  const sent = message.type === 'send'
  return (
    <li className="border-b border-border/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid w-full grid-cols-[20px_64px_56px_1fr] items-center gap-2 px-3 py-1.5 text-left font-mono text-xs outline-none hover:bg-muted/60 focus-visible:bg-muted"
      >
        {sent ? (
          <ArrowUp className="size-3.5 text-success" aria-label="Sent" />
        ) : (
          <ArrowDown className="size-3.5 text-info" aria-label="Received" />
        )}
        <span className="text-subtle-foreground tabular">+{(message.time - start).toFixed(3)}s</span>
        <span className="text-right text-subtle-foreground tabular">{formatBytes(message.data.length)}</span>
        <span className={cn('min-w-0', open ? 'break-all whitespace-pre-wrap' : 'truncate')}>
          <Highlight text={open && json !== undefined ? prettyJson(json) : message.data} />
        </span>
      </button>
    </li>
  )
}

export function WebSocketTab({ entry }: { entry: Entry }) {
  const messages = entry.raw._webSocketMessages ?? []
  const query = useFindQuery()
  const [direction, setDirection] = useState<Direction>('all')
  const start = messages[0]?.time ?? 0
  const shown = messages.filter(
    (m) =>
      (direction === 'all' || m.type === direction) &&
      (query.length < MIN_QUERY || matchesQuery(m.data, query)),
  )
  const sent = messages.filter((m) => m.type === 'send').length

  return (
    <div>
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <SegmentedControl
          type="single"
          value={direction}
          onValueChange={(v) => v && setDirection(v as Direction)}
          aria-label="Message direction"
        >
          <SegmentedItem value="all">All {messages.length}</SegmentedItem>
          <SegmentedItem value="send">Sent {sent}</SegmentedItem>
          <SegmentedItem value="receive">Received {messages.length - sent}</SegmentedItem>
        </SegmentedControl>
      </div>
      <ul>
        {shown.map((message, i) => (
          <MessageRow key={i} message={message} start={start} />
        ))}
      </ul>
      {!shown.length && <p className="p-6 text-center text-xs text-muted-foreground">No messages match</p>}
    </div>
  )
}
