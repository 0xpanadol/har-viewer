import { ChevronDown, Cookie, Download, GitCompareArrows, Link, ShieldCheck, Trash, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip } from '@/components/ui/tooltip'
import { formatNumber } from '@/lib/format'
import { copyUrls, deleteEntries } from '@/services/entry-actions'
import { exportEntries, exportTarget } from '@/services/export'
import { useAppStore } from '@/store'

/** Floating bulk-action bar (Linear/Gmail pattern) shown while rows are ticked. */
export function SelectionBar() {
  const checkedIds = useAppStore((s) => s.checkedIds)
  const clearChecked = useAppStore((s) => s.clearChecked)
  const openDialog = useAppStore((s) => s.openDialog)
  if (!checkedIds.length) return null

  const exportAs = (format: Parameters<typeof exportEntries>[0]) =>
    exportEntries(format, exportTarget().entries, 'selected')

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="pointer-events-none fixed inset-x-0 bottom-10 z-40 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex animate-in items-center gap-1 rounded-xl bg-popover p-1.5 shadow-overlay fade-in-0 slide-in-from-bottom-2">
        <span className="px-2 text-xs font-medium whitespace-nowrap tabular">
          {formatNumber(checkedIds.length)} selected
        </span>
        <span className="h-5 w-px bg-border" />
        <Button variant="ghost" size="sm" onClick={() => exportAs('har')}>
          <Download /> HAR
        </Button>
        <Button variant="ghost" size="sm" onClick={() => exportAs('har-sanitized')}>
          <ShieldCheck /> <span className="hidden sm:inline">Sanitized</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              More <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="center">
            <DropdownMenuItem onSelect={() => exportAs('csv')}>
              <Download /> Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => exportAs('postman')}>
              <Download /> Export Postman collection
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => exportAs('cookies-netscape')}>
              <Cookie /> Export cookies (cookies.txt)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => exportAs('cookies-json')}>
              <Cookie /> Export cookies (JSON)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => copyUrls(exportTarget().entries)}>
              <Link /> Copy URLs
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {checkedIds.length === 2 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDialog({ type: 'diff', ids: [checkedIds[0]!, checkedIds[1]!] })}
          >
            <GitCompareArrows /> Diff
          </Button>
        )}
        <Button variant="danger" size="sm" onClick={() => deleteEntries(checkedIds)}>
          <Trash /> <span className="hidden sm:inline">Delete</span>
        </Button>
        <span className="h-5 w-px bg-border" />
        <Tooltip content="Clear selection" shortcut={['Esc']}>
          <Button variant="ghost" size="icon-sm" onClick={clearChecked} aria-label="Clear selection">
            <X />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}
