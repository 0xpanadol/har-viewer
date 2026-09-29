import { ChevronRight } from 'lucide-react'
import { Collapsible } from 'radix-ui'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface SectionProps {
  title: ReactNode
  count?: number
  actions?: ReactNode
  defaultOpen?: boolean
  className?: string
  children: ReactNode
}

/** Collapsible block used throughout the inspector and analysis views. */
export function Section({ title, count, actions, defaultOpen = true, className, children }: SectionProps) {
  return (
    <Collapsible.Root
      defaultOpen={defaultOpen}
      className={cn('group/section border-b last:border-b-0', className)}
    >
      <div className="flex h-9 items-center gap-2 pr-2">
        <Collapsible.Trigger className="flex h-full min-w-0 flex-1 cursor-default items-center gap-1.5 pl-3 text-left text-xs font-semibold outline-none select-none focus-visible:bg-muted">
          <ChevronRight className="size-3.5 shrink-0 text-subtle-foreground transition-transform group-data-[state=open]/section:rotate-90" />
          <span className="truncate">{title}</span>
          {count !== undefined && <span className="font-normal text-subtle-foreground tabular">{count}</span>}
        </Collapsible.Trigger>
        {actions && (
          <div className="flex items-center gap-0.5 opacity-70 transition-opacity group-hover/section:opacity-100">
            {actions}
          </div>
        )}
      </div>
      <Collapsible.Content className="pb-3">{children}</Collapsible.Content>
    </Collapsible.Root>
  )
}
