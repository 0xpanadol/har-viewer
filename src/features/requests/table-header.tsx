import { ArrowDown, ArrowUp } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store'
import type { ColumnId } from '@/store/ui-slice'
import { COLUMNS } from './columns'

interface TableHeaderProps {
  columns: Record<ColumnId, boolean>
  template: string
  allChecked: boolean
  someChecked: boolean
  onToggleAll: () => void
}

export function TableHeader({ columns, template, allChecked, someChecked, onToggleAll }: TableHeaderProps) {
  const sort = useAppStore((s) => s.sort)
  const cycleSort = useAppStore((s) => s.cycleSort)

  return (
    <div
      role="row"
      className="grid h-8 shrink-0 items-center border-b bg-panel text-xs font-medium text-muted-foreground select-none"
      style={{ gridTemplateColumns: template }}
    >
      <div role="columnheader" className="flex justify-center">
        <Checkbox
          checked={allChecked ? true : someChecked ? 'indeterminate' : false}
          onCheckedChange={onToggleAll}
          aria-label="Select all visible requests"
        />
      </div>
      <div role="columnheader" className="pr-3 text-right">
        #
      </div>
      {COLUMNS.filter((c) => columns[c.id]).map((column) => {
        const active = sort.column === column.sort
        const Arrow = sort.direction === 'asc' ? ArrowUp : ArrowDown
        return (
          <div
            key={column.id}
            role="columnheader"
            aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            className="min-w-0 px-2"
          >
            <button
              type="button"
              onClick={() => cycleSort(column.sort)}
              className={cn(
                '-mx-1 inline-flex h-6 max-w-full items-center gap-1 rounded px-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40',
                column.align === 'right' && 'float-right flex-row-reverse',
                active && 'text-foreground',
              )}
            >
              <span className="truncate">{column.label}</span>
              {active && <Arrow className="size-3 shrink-0" />}
            </button>
          </div>
        )
      })}
    </div>
  )
}
