import { ChevronRight } from 'lucide-react'
import { Collapsible } from 'radix-ui'
import { useState, type ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import type { FacetOption } from '@/har/facets'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'

interface FacetSectionProps {
  title: string
  activeCount?: number
  onClear?: () => void
  defaultOpen?: boolean
  children: ReactNode
}

export function FacetSection({
  title,
  activeCount = 0,
  onClear,
  defaultOpen = true,
  children,
}: FacetSectionProps) {
  return (
    <Collapsible.Root defaultOpen={defaultOpen} className="group/facet border-b px-2 py-1.5">
      <div className="flex h-7 items-center">
        <Collapsible.Trigger className="flex h-full flex-1 cursor-default items-center gap-1.5 rounded-md px-1.5 text-xs font-medium text-muted-foreground outline-none select-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40">
          <ChevronRight className="size-3.5 transition-transform group-data-[state=open]/facet:rotate-90" />
          {title}
          {activeCount > 0 && (
            <span className="rounded bg-primary/12 px-1 text-2xs text-primary tabular">{activeCount}</span>
          )}
        </Collapsible.Trigger>
        {activeCount > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="rounded px-1.5 text-2xs text-subtle-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            Clear
          </button>
        )}
      </div>
      <Collapsible.Content className="pt-0.5">{children}</Collapsible.Content>
    </Collapsible.Root>
  )
}

interface FacetListProps {
  options: readonly FacetOption[]
  selected: readonly string[]
  onToggle: (value: string) => void
  onOnly: (value: string) => void
  renderLabel?: (option: FacetOption) => ReactNode
  /** Collapse long lists behind "Show all". */
  limit?: number
}

export function FacetList({ options, selected, onToggle, onOnly, renderLabel, limit }: FacetListProps) {
  const [expanded, setExpanded] = useState(false)
  const shown = limit && !expanded ? options.slice(0, limit) : options

  return (
    <ul className="flex flex-col">
      {shown.map((option) => {
        const checked = selected.includes(option.value)
        return (
          <li key={option.value} className="group/opt relative">
            <label className="flex h-7 cursor-default items-center gap-2 rounded-md px-1.5 text-xs select-none hover:bg-muted">
              <Checkbox checked={checked} onCheckedChange={() => onToggle(option.value)} />
              <span
                className={cn(
                  'min-w-0 flex-1 truncate',
                  checked ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {renderLabel ? renderLabel(option) : option.value || '(none)'}
              </span>
              <span className="text-2xs text-subtle-foreground tabular group-hover/opt:invisible">
                {formatNumber(option.count)}
              </span>
            </label>
            <button
              type="button"
              onClick={() => onOnly(option.value)}
              className="invisible absolute top-1/2 right-1 -translate-y-1/2 rounded px-1.5 py-0.5 text-2xs font-medium text-muted-foreground outline-none group-hover/opt:visible hover:bg-background hover:text-foreground focus-visible:visible"
            >
              Only
            </button>
          </li>
        )
      })}
      {limit !== undefined && options.length > limit && (
        <li>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="h-7 w-full rounded-md px-1.5 text-left text-xs text-primary outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {expanded ? 'Show less' : `Show all ${options.length}`}
          </button>
        </li>
      )}
    </ul>
  )
}
