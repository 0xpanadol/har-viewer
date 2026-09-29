import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { useAppStore } from '@/store'
import { selectIssueCount } from '@/store/selectors'
import type { ViewId } from '@/store/ui-slice'
import { VIEWS } from './views'

export function ViewTabs() {
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const issues = useAppStore(selectIssueCount)
  const requests = useAppStore((s) => s.entries.length)
  const comparing = useAppStore((s) => s.comparison !== null)

  const badge = (id: ViewId) => {
    if (id === 'requests') return formatNumber(requests)
    if (id === 'issues' && issues) return formatNumber(issues)
    if (id === 'compare' && comparing) return '•'
    return null
  }

  return (
    <Tabs value={view} onValueChange={(v) => setView(v as ViewId)}>
      <TabsList className="border-b bg-panel px-4" aria-label="Views">
        {VIEWS.map((v, i) => {
          const count = badge(v.id)
          return (
            <Tooltip key={v.id} content={v.description} shortcut={[String(i + 1)]} side="bottom">
              <TabsTrigger value={v.id}>
                <v.icon className="size-4 text-subtle-foreground in-data-[state=active]:text-foreground" />
                {v.label}
                {count && (
                  <span
                    className={cn(
                      'rounded px-1 text-2xs font-medium tabular',
                      v.id === 'issues' ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {count}
                  </span>
                )}
              </TabsTrigger>
            </Tooltip>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
