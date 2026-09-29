import { ChevronDown, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatNumber } from '@/lib/format'
import { EXPORT_FORMATS, exportEntries, exportTarget } from '@/services/export'
import { useAppStore } from '@/store'
import { useVisibleEntries } from '@/store/selectors'

export function ExportMenu() {
  const checked = useAppStore((s) => s.checkedIds.length)
  const visible = useVisibleEntries().length
  const scope = checked ? `${formatNumber(checked)} selected` : `${formatNumber(visible)} visible`

  const run = (id: (typeof EXPORT_FORMATS)[number]['id']) => {
    const { entries, label } = exportTarget()
    exportEntries(id, entries, label)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Download /> <span className="hidden sm:inline">Export</span>
          <ChevronDown className="text-subtle-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Export {scope} requests</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {EXPORT_FORMATS.map((format) => (
          <DropdownMenuItem key={format.id} onSelect={() => run(format.id)} className="h-auto py-1.5">
            <span className="flex flex-col">
              <span>{format.label}</span>
              <span className="text-xs text-muted-foreground">{format.hint}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
