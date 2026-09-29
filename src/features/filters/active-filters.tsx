import { X } from 'lucide-react'
import type { FilterCriteria } from '@/har/filter'
import { formatBytes, formatDuration } from '@/lib/format'
import { useAppStore } from '@/store'
import { useCriteria } from '@/store/selectors'

interface Chip {
  key: string
  label: string
  value: string
  clear: () => void
}

function rangeText(min: number | null, max: number | null, format: (n: number) => string) {
  if (min !== null && max !== null) return `${format(min)} – ${format(max)}`
  if (min !== null) return `≥ ${format(min)}`
  return `≤ ${format(max!)}`
}

function listText(values: string[]) {
  return values.length > 2 ? `${values.slice(0, 2).join(', ')} +${values.length - 2}` : values.join(', ')
}

function buildChips(c: FilterCriteria): Chip[] {
  const s = useAppStore.getState
  const chips: Chip[] = []
  if (c.statuses.length)
    chips.push({
      key: 'status',
      label: 'Status',
      value: listText(c.statuses),
      clear: () => s().setFacet('statuses', []),
    })
  if (c.methods.length)
    chips.push({
      key: 'method',
      label: 'Method',
      value: listText(c.methods),
      clear: () => s().setFacet('methods', []),
    })
  if (c.types.length)
    chips.push({
      key: 'type',
      label: 'Type',
      value: listText(c.types),
      clear: () => s().setFacet('types', []),
    })
  if (c.domains.length)
    chips.push({
      key: 'domain',
      label: 'Domain',
      value: listText(c.domains),
      clear: () => s().setFacet('domains', []),
    })
  if (c.minTime !== null || c.maxTime !== null) {
    chips.push({
      key: 'time',
      label: 'Duration',
      value: rangeText(c.minTime, c.maxTime, formatDuration),
      clear: () => s().setTimeRange(null, null),
    })
  }
  if (c.minSize !== null || c.maxSize !== null) {
    chips.push({
      key: 'size',
      label: 'Size',
      value: rangeText(c.minSize, c.maxSize, formatBytes),
      clear: () => s().setSizeRange(null, null),
    })
  }
  if (c.timeWindow) {
    chips.push({
      key: 'window',
      label: 'Started',
      value: `${formatDuration(c.timeWindow[0])} – ${formatDuration(c.timeWindow[1])}`,
      clear: () => s().setTimeWindow(null),
    })
  }
  return chips
}

/** Removable summary of active facet filters (the query stays visible in the search field). */
export function ActiveFilters() {
  const chips = buildChips(useCriteria())
  const reset = useAppStore((s) => s.resetFilters)
  if (!chips.length) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex h-6 items-center gap-1 rounded-md border bg-background pr-0.5 pl-2 text-xs"
        >
          <span className="text-muted-foreground">{chip.label}</span>
          <span className="max-w-48 truncate font-medium">{chip.value}</span>
          <button
            type="button"
            onClick={chip.clear}
            aria-label={`Remove ${chip.label} filter`}
            className="grid size-5 place-items-center rounded text-subtle-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={reset}
        className="h-6 rounded-md px-1.5 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        Clear all
      </button>
    </div>
  )
}
