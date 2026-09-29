import { ChevronDown, ChevronUp, Ellipsis, NotebookPen, Pin, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { CopyButton } from '@/components/copy-button'
import { MethodLabel, StatusCode } from '@/components/http-labels'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip } from '@/components/ui/tooltip'
import type { Entry } from '@/har/types'
import { cn } from '@/lib/cn'
import { formatBytes, formatDuration } from '@/lib/format'
import { moveSelection } from '@/services/navigation'
import { useAppStore } from '@/store'
import { EntryDropdownMenuContent } from '../entry-actions/entry-menus'

function Meta({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap text-muted-foreground">{children}</span>
}

export function InspectorHeader({ entry }: { entry: Entry }) {
  const pinned = useAppStore((s) => s.pinnedIds.includes(entry.id))
  const note = useAppStore((s) => s.notes[entry.id])
  const togglePinned = useAppStore((s) => s.togglePinned)
  const openDialog = useAppStore((s) => s.openDialog)
  const setInspectorOpen = useAppStore((s) => s.setInspectorOpen)

  return (
    <header className="shrink-0 border-b px-4 pt-3 pb-3">
      <div className="flex items-center gap-2">
        <MethodLabel method={entry.method} className="text-[13px]" />
        <StatusCode status={entry.status} statusText={entry.statusText} className="text-[13px]" />
        <div className="ml-auto flex items-center gap-0.5">
          <Tooltip content="Previous request" shortcut={['K']}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => moveSelection(-1)}
              aria-label="Previous request"
            >
              <ChevronUp />
            </Button>
          </Tooltip>
          <Tooltip content="Next request" shortcut={['J']}>
            <Button variant="ghost" size="icon-sm" onClick={() => moveSelection(1)} aria-label="Next request">
              <ChevronDown />
            </Button>
          </Tooltip>
          <Tooltip content={pinned ? 'Unpin' : 'Pin to top'} shortcut={['P']}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => togglePinned(entry.id)}
              aria-pressed={pinned}
              aria-label="Pin request"
              className={cn(pinned && 'text-primary hover:text-primary')}
            >
              <Pin className={cn(pinned && 'fill-current')} />
            </Button>
          </Tooltip>
          <DropdownMenu>
            <Tooltip content="More actions">
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="More actions">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
            </Tooltip>
            <EntryDropdownMenuContent entry={entry} />
          </DropdownMenu>
          <Tooltip content="Close" shortcut={['Esc']}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setInspectorOpen(false)}
              aria-label="Close inspector"
            >
              <X />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="group/url mt-2 flex items-start gap-1">
        <p
          className="line-clamp-3 min-w-0 flex-1 font-mono text-[13px] leading-snug break-all"
          title={entry.url}
        >
          <span className="text-subtle-foreground">{entry.host}</span>
          {entry.path}
        </p>
        <CopyButton
          value={entry.url}
          label="Copy URL"
          className="-mt-0.5 opacity-0 group-hover/url:opacity-100 focus-visible:opacity-100"
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <Meta>
          <span className="text-foreground tabular">{formatDuration(entry.time)}</span>
        </Meta>
        <Meta>
          <span className="text-foreground tabular">{formatBytes(entry.size)}</span>
          {entry.transferSize >= 0 && entry.transferSize !== entry.size && (
            <> · {formatBytes(entry.transferSize)} over the wire</>
          )}
        </Meta>
        <Meta>{entry.type}</Meta>
        {entry.httpVersion && <Meta>{entry.httpVersion}</Meta>}
        <Meta>#{entry.id + 1}</Meta>
      </div>

      {note && (
        <button
          type="button"
          onClick={() => openDialog({ type: 'note', entryId: entry.id })}
          className="mt-3 flex w-full items-start gap-2 rounded-md border border-warning/25 bg-warning/8 px-2.5 py-2 text-left text-xs outline-none hover:bg-warning/12 focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <NotebookPen className="mt-px size-3.5 shrink-0 text-warning" />
          <span className="line-clamp-4 whitespace-pre-wrap">{note.text}</span>
        </button>
      )}
    </header>
  )
}
