import { Keyboard, Undo2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { summarize } from '@/har/metrics'
import { formatBytes, formatDuration, formatNumber } from '@/lib/format'
import { MOD } from '@/lib/platform'
import { persistSession } from '@/services/capture'
import { undoDelete } from '@/services/entry-actions'
import { useAppStore } from '@/store'
import { useVisibleEntries } from '@/store/selectors'

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="whitespace-nowrap">
      {label} <span className="font-medium text-foreground tabular">{children}</span>
    </span>
  )
}

export function StatusBar() {
  const entries = useAppStore((s) => s.entries)
  const log = useAppStore((s) => s.log)
  const isDirty = useAppStore((s) => s.isDirty)
  const canUndo = useAppStore((s) => s.undoStack.length > 0)
  const openDialog = useAppStore((s) => s.openDialog)
  const visible = useVisibleEntries()
  const all = summarize(entries, log)
  const shown = visible.length === entries.length ? all : summarize(visible, log)

  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 overflow-hidden border-t bg-panel px-3 text-xs text-muted-foreground">
      <Stat label="Requests">
        {visible.length === entries.length
          ? formatNumber(entries.length)
          : `${formatNumber(visible.length)} / ${formatNumber(entries.length)}`}
      </Stat>
      <Stat label="Transferred">{formatBytes(shown.transferredBytes)}</Stat>
      <span className="hidden sm:inline">
        <Stat label="Resources">{formatBytes(shown.contentBytes)}</Stat>
      </span>
      <span className="hidden md:inline">
        <Stat label="Finish">{formatDuration(all.finish)}</Stat>
      </span>
      <span className="hidden lg:inline">
        <Stat label="DOMContentLoaded">{formatDuration(all.domContentLoaded)}</Stat>
      </span>
      <span className="hidden lg:inline">
        <Stat label="Load">{formatDuration(all.load)}</Stat>
      </span>

      <div className="ml-auto flex items-center gap-3">
        {isDirty && (
          <span className="flex items-center gap-2 text-warning">
            <span className="size-1.5 rounded-full bg-warning" />
            <span className="hidden sm:inline">Unsaved deletions</span>
            <button
              type="button"
              onClick={() => void persistSession({ notify: true })}
              className="rounded px-1 font-medium text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              Save <span className="text-subtle-foreground">{MOD} S</span>
            </button>
          </span>
        )}
        {canUndo && (
          <button
            type="button"
            onClick={undoDelete}
            className="inline-flex items-center gap-1 rounded px-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <Undo2 className="size-3.5" /> Undo
          </button>
        )}
        <button
          type="button"
          onClick={() => openDialog({ type: 'shortcuts' })}
          className="hidden items-center gap-1 rounded px-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 sm:inline-flex"
        >
          <Keyboard className="size-3.5" /> Shortcuts <span className="text-subtle-foreground">?</span>
        </button>
      </div>
    </footer>
  )
}
