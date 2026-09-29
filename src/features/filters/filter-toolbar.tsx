import { PanelLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { countActiveFilters } from '@/har/filter'
import { useIsDesktop } from '@/hooks/use-media-query'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { useAppStore } from '@/store'
import { useCriteria, useVisibleEntries } from '@/store/selectors'
import { ActiveFilters } from './active-filters'
import { SearchField } from './search-field'

/** Shared header for the filtered views (requests, waterfall, timeline). */
export function FilterToolbar({ actions }: { actions?: ReactNode }) {
  const isDesktop = useIsDesktop()
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const total = useAppStore((s) => s.entries.length)
  const shown = useVisibleEntries().length
  const active = countActiveFilters(useCriteria())

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b px-3 py-2">
      <div className="flex items-center gap-2">
        <Tooltip content={sidebarOpen && isDesktop ? 'Hide filters' : 'Show filters'} shortcut={['F']}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-pressed={sidebarOpen}
            aria-label="Toggle filters"
            className={cn('relative', sidebarOpen && isDesktop && 'text-foreground')}
          >
            <PanelLeft />
            {active > 0 && (!sidebarOpen || !isDesktop) && (
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />
            )}
          </Button>
        </Tooltip>
        <SearchField className="max-w-xl flex-1" />
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <span className="px-1 text-xs whitespace-nowrap text-muted-foreground tabular" aria-live="polite">
            {shown === total ? (
              <>{formatNumber(total)} requests</>
            ) : (
              <>
                <span className="font-medium text-foreground">{formatNumber(shown)}</span> of{' '}
                {formatNumber(total)}
              </>
            )}
          </span>
          {actions}
        </div>
      </div>
      <ActiveFilters />
    </div>
  )
}
