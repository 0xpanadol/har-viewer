import type { SortColumn } from '@/har/filter'
import type { ColumnId } from '@/store/ui-slice'

export interface ColumnDefinition {
  id: ColumnId
  label: string
  width: string
  /** Smallest width the column needs; used to decide what fits. */
  minWidth: number
  sort: SortColumn
  align?: 'right'
}

export const COLUMNS: readonly ColumnDefinition[] = [
  { id: 'method', label: 'Method', width: '72px', minWidth: 72, sort: 'method' },
  { id: 'url', label: 'Name', width: 'minmax(200px, 1fr)', minWidth: 200, sort: 'url' },
  { id: 'status', label: 'Status', width: '72px', minWidth: 72, sort: 'status' },
  { id: 'type', label: 'Type', width: '60px', minWidth: 60, sort: 'type' },
  { id: 'size', label: 'Size', width: '80px', minWidth: 80, sort: 'size', align: 'right' },
  { id: 'time', label: 'Time', width: '76px', minWidth: 76, sort: 'time', align: 'right' },
  { id: 'waterfall', label: 'Waterfall', width: 'minmax(140px, 0.55fr)', minWidth: 140, sort: 'start' },
]

export const ROW_HEIGHT = 32

/** Checkbox + row number are always present. */
const LEADING = '36px 48px'
const LEADING_WIDTH = 84

/** Dropped first when space runs out (as DevTools does when its detail pane opens). */
const DROP_ORDER: readonly ColumnId[] = ['waterfall', 'type', 'size', 'method']

/** The user's column choice, minus whatever doesn't fit in `width` px. Returns `preferred` when all fit. */
export function fitColumns(preferred: Record<ColumnId, boolean>, width: number): Record<ColumnId, boolean> {
  const needed = (cols: Record<ColumnId, boolean>) =>
    LEADING_WIDTH + COLUMNS.filter((c) => cols[c.id]).reduce((sum, c) => sum + c.minWidth, 0)
  if (!width || needed(preferred) <= width) return preferred
  const fitted = { ...preferred }
  for (const id of DROP_ORDER) {
    fitted[id] = false
    if (needed(fitted) <= width) break
  }
  return fitted
}

export function gridTemplate(visible: Record<ColumnId, boolean>): string {
  return [LEADING, ...COLUMNS.filter((c) => visible[c.id]).map((c) => c.width)].join(' ')
}
