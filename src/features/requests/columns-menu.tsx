import { Columns3Cog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip } from '@/components/ui/tooltip'
import { useAppStore } from '@/store'
import { COLUMNS } from './columns'

export function ColumnsMenu() {
  const columns = useAppStore((s) => s.columns)
  const toggleColumn = useAppStore((s) => s.toggleColumn)
  const urlPreviews = useAppStore((s) => s.urlPreviews)
  const setUrlPreviews = useAppStore((s) => s.setUrlPreviews)

  return (
    <DropdownMenu>
      <Tooltip content="Table display">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Table display options">
            <Columns3Cog />
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Columns</DropdownMenuLabel>
        {COLUMNS.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={columns[column.id]}
            onCheckedChange={() => toggleColumn(column.id)}
            onSelect={(e) => e.preventDefault()}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={urlPreviews}
          onCheckedChange={setUrlPreviews}
          onSelect={(e) => e.preventDefault()}
        >
          URL preview on hover
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
