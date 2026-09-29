import {
  ChevronsUpDown,
  FileBraces,
  FileStack,
  FileUp,
  FlaskConical,
  GitCompareArrows,
  Save,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { pickFile } from '@/lib/file-picker'
import { formatNumber } from '@/lib/format'
import { MOD } from '@/lib/platform'
import { closeCapture, loadComparison, mergeFile, openSample, persistSession } from '@/services/capture'
import { useAppStore } from '@/store'
import { openFromPicker } from '../command/commands'

export function FileMenu() {
  const fileName = useAppStore((s) => s.fileName)
  const count = useAppStore((s) => s.entries.length)
  const creator = useAppStore((s) => s.log?.creator)
  const isDirty = useAppStore((s) => s.isDirty)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 max-w-[min(40vw,360px)] gap-2 px-2 text-foreground">
          <FileBraces className="text-muted-foreground" />
          <span className="truncate font-medium">{fileName || 'Untitled capture'}</span>
          {isDirty && (
            <span className="size-1.5 shrink-0 rounded-full bg-warning" aria-label="Unsaved changes" />
          )}
          <span className="hidden font-normal text-subtle-foreground tabular sm:inline">
            {formatNumber(count)}
          </span>
          <ChevronsUpDown className="text-subtle-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="normal-case">
          <span className="block truncate text-xs font-medium tracking-normal text-foreground">
            {fileName}
          </span>
          <span className="block font-normal tracking-normal">
            {formatNumber(count)} requests{creator && ` · ${creator.name} ${creator.version}`}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void openFromPicker()}>
          <FileUp /> Open another file…
          <DropdownMenuShortcut>{MOD} O</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            const f = await pickFile()
            if (f) await mergeFile(f)
          }}
        >
          <FileStack /> Merge another HAR…
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            const f = await pickFile()
            if (f) await loadComparison(f)
          }}
        >
          <GitCompareArrows /> Compare with…
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void openSample()}>
          <FlaskConical /> Load sample capture
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void persistSession({ notify: true })}>
          <Save /> Save session
          <DropdownMenuShortcut>{MOD} S</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem variant="danger" onSelect={() => void closeCapture()}>
          <X /> Close capture
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
