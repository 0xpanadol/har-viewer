import { Search } from 'lucide-react'
import { GithubIcon, LogoMark, REPO_URL } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { KbdCombo } from '@/components/ui/kbd'
import { Tooltip } from '@/components/ui/tooltip'
import { MOD } from '@/lib/platform'
import { useAppStore } from '@/store'
import { ExportMenu } from './export-menu'
import { FileMenu } from './file-menu'
import { ThemeMenu } from './theme-menu'
import { ValidationPopover } from './validation-popover'

export function AppHeader() {
  const openDialog = useAppStore((s) => s.openDialog)

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-panel px-3">
      <div className="flex min-w-0 items-center gap-1.5">
        <LogoMark className="size-6 shrink-0" />
        <span className="hidden text-[13px] font-semibold md:inline">HAR Viewer</span>
        <span className="mx-1 hidden text-border-strong md:inline" aria-hidden>
          /
        </span>
        <FileMenu />
        <ValidationPopover />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => openDialog({ type: 'palette' })}
          className="hidden h-8 w-72 items-center gap-2 rounded-md border bg-background px-2.5 text-[13px] whitespace-nowrap text-subtle-foreground transition-colors outline-none hover:border-border-strong hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40 md:flex"
        >
          <Search className="size-4" />
          <span className="flex-1 truncate text-left">Search or run a command…</span>
          <KbdCombo keys={[MOD, 'K']} />
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={() => openDialog({ type: 'palette' })}
          aria-label="Command palette"
        >
          <Search />
        </Button>
        <ExportMenu />
        <ThemeMenu />
        <Tooltip content="Source on GitHub">
          <Button variant="ghost" size="icon-sm" asChild>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub repository">
              <GithubIcon />
            </a>
          </Button>
        </Tooltip>
      </div>
    </header>
  )
}
