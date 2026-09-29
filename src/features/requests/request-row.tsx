import { Pin } from 'lucide-react'
import { memo, type MouseEvent } from 'react'
import { MethodLabel, StatusCode } from '@/components/http-labels'
import { Checkbox } from '@/components/ui/checkbox'
import type { MatchLocations } from '@/har/search'
import type { Entry } from '@/har/types'
import { cn } from '@/lib/cn'
import { formatBytes, formatDuration } from '@/lib/format'
import type { ColumnId } from '@/store/ui-slice'
import { ROW_HEIGHT } from './columns'
import { NameCell, WaterfallCell } from './row-cells'

export interface RowProps {
  entry: Entry
  index: number
  offset: number
  template: string
  columns: Record<ColumnId, boolean>
  selected: boolean
  checked: boolean
  pinned: boolean
  duplicate: boolean
  note: string | undefined
  preview: boolean
  locations: MatchLocations | null
  captureStart: number
  captureDuration: number
  onSelect: (entry: Entry) => void
  onCheck: (entry: Entry, index: number, shiftKey: boolean) => void
}

function timeTone(ms: number) {
  if (ms >= 3000) return 'text-danger'
  if (ms >= 1000) return 'text-warning'
  if (ms < 100) return 'text-muted-foreground'
  return 'text-foreground'
}

export const RequestRow = memo(function RequestRow(props: RowProps) {
  const { entry, index, offset, template, columns, selected, checked, pinned, onSelect, onCheck } = props
  const transfer =
    entry.transferSize >= 0 && entry.transferSize !== entry.size
      ? `${formatBytes(entry.transferSize)} transferred`
      : undefined

  return (
    <div
      role="row"
      aria-rowindex={index + 2}
      aria-selected={selected}
      data-entry-id={entry.id}
      onClick={() => onSelect(entry)}
      style={{ height: ROW_HEIGHT, transform: `translateY(${offset}px)`, gridTemplateColumns: template }}
      className={cn(
        'absolute inset-x-0 top-0 grid cursor-default items-center border-b border-border/60 text-xs',
        selected
          ? 'bg-selection-strong shadow-[inset_2px_0_0_var(--primary)]'
          : checked
            ? 'bg-selection hover:bg-selection-strong'
            : 'hover:bg-muted/60',
      )}
    >
      <div role="gridcell" className="flex justify-center" onClick={(e: MouseEvent) => e.stopPropagation()}>
        <Checkbox
          checked={checked}
          tabIndex={-1}
          // Keep focus (and scroll position) where it is; the row is keyboard-driven.
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault()
            onCheck(entry, index, e.shiftKey)
          }}
          aria-label={`Select request ${entry.id + 1}`}
        />
      </div>
      <div
        role="gridcell"
        className="flex items-center justify-end gap-1 pr-3 font-mono text-subtle-foreground tabular"
      >
        {pinned && <Pin className="size-3 fill-current text-primary" aria-label="Pinned" />}
        {entry.id + 1}
      </div>
      {columns.method && (
        <div role="gridcell" className="px-2">
          <MethodLabel method={entry.method} />
        </div>
      )}
      {columns.url && (
        <div role="gridcell" className="min-w-0">
          <NameCell
            entry={entry}
            note={props.note}
            duplicate={props.duplicate}
            preview={props.preview}
            locations={props.locations}
          />
        </div>
      )}
      {columns.status && (
        <div role="gridcell" className="px-2">
          <StatusCode status={entry.status} />
        </div>
      )}
      {columns.type && (
        <div role="gridcell" className="truncate px-2 text-muted-foreground">
          {entry.type}
        </div>
      )}
      {columns.size && (
        <div
          role="gridcell"
          className="truncate px-2 text-right font-mono text-muted-foreground tabular"
          title={transfer}
        >
          {formatBytes(entry.size)}
        </div>
      )}
      {columns.time && (
        <div
          role="gridcell"
          className={cn('truncate px-2 text-right font-mono tabular', timeTone(entry.time))}
        >
          {formatDuration(entry.time)}
        </div>
      )}
      {columns.waterfall && (
        <div role="gridcell" className="h-full">
          <WaterfallCell entry={entry} start={props.captureStart} duration={props.captureDuration} />
        </div>
      )}
    </div>
  )
})
