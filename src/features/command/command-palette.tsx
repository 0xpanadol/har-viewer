import { useState } from 'react'
import { MethodLabel, StatusCode } from '@/components/http-labels'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Kbd, KbdCombo } from '@/components/ui/kbd'
import type { Entry } from '@/har/types'
import { useAppStore } from '@/store'
import { buildCommands } from './commands'

const REQUEST_RESULTS = 30

/** Every typed word must appear in the item's text or keywords; earlier matches rank higher. */
function paletteFilter(value: string, search: string, keywords: string[] = []): number {
  const haystack = `${value} ${keywords.join(' ')}`.toLowerCase()
  const words = search.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.every((word) => haystack.includes(word))) return 0
  return 1 - Math.min(haystack.indexOf(words[0] ?? ''), 100) / 200
}

function findRequests(entries: readonly Entry[], search: string): Entry[] {
  const needle = search.toLowerCase()
  const out: Entry[] = []
  for (const e of entries) {
    if (e.url.toLowerCase().includes(needle)) out.push(e)
    if (out.length === REQUEST_RESULTS) break
  }
  return out
}

function PaletteBody() {
  const state = useAppStore()
  const [search, setSearch] = useState('')
  const groups = buildCommands(state)
  const requests = search.trim().length >= 2 ? findRequests(state.entries, search.trim()) : []

  const run = (action: () => void) => {
    state.closeDialog()
    action()
  }

  return (
    <Command loop filter={paletteFilter}>
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Type a command or search requests by URL…"
      />
      <CommandList>
        <CommandEmpty>No matching commands or requests.</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group.heading} heading={group.heading}>
            {group.commands.map((command) => (
              <CommandItem
                key={command.id}
                value={`${group.heading} ${command.label}`}
                keywords={command.keywords}
                onSelect={() => run(command.run)}
              >
                {command.icon && <command.icon />}
                <span className="truncate">{command.label}</span>
                {command.shortcut && <KbdCombo keys={command.shortcut} className="ml-auto" />}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        {requests.length > 0 && (
          <CommandGroup heading="Requests">
            {requests.map((entry) => (
              <CommandItem
                key={entry.id}
                value={`request ${entry.id} ${entry.url}`}
                onSelect={() => run(() => state.inspect(entry.id))}
              >
                <MethodLabel method={entry.method} className="w-12 shrink-0" />
                <span className="min-w-0 flex-1 truncate font-mono text-xs">
                  <span className="text-subtle-foreground">{entry.host}</span>
                  {entry.path}
                </span>
                <StatusCode status={entry.status} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      <div className="flex items-center gap-4 border-t px-4 py-2 text-2xs text-subtle-foreground">
        <span className="inline-flex items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> navigate
        </span>
        <span className="inline-flex items-center gap-1">
          <Kbd>↵</Kbd> run
        </span>
        <span className="inline-flex items-center gap-1">
          <Kbd>Esc</Kbd> close
        </span>
      </div>
    </Command>
  )
}

export function CommandPalette() {
  const open = useAppStore((s) => s.dialog.type === 'palette')
  const closeDialog = useAppStore((s) => s.closeDialog)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent hideClose aria-describedby={undefined} className="top-[14vh] max-w-xl">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <PaletteBody />
      </DialogContent>
    </Dialog>
  )
}
