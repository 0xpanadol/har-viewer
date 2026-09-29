import { CircleAlert, OctagonAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store'

const LIMIT = 100

/** Structural HAR problems found on load — informational, never blocking. */
export function ValidationPopover() {
  const issues = useAppStore((s) => s.validation)
  const inspect = useAppStore((s) => s.inspect)
  if (!issues.length) return null
  const errors = issues.filter((i) => i.level === 'error').length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Badge tone={errors ? 'danger' : 'warning'} size="md" className="cursor-default">
            {errors ? <OctagonAlert /> : <CircleAlert />}
            {issues.length}{' '}
            <span className="hidden sm:inline">format {issues.length === 1 ? 'warning' : 'warnings'}</span>
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0">
        <div className="border-b px-3 py-2.5">
          <p className="text-[13px] font-semibold">HAR validation</p>
          <p className="text-xs text-muted-foreground">
            {errors} errors · {issues.length - errors} warnings. The file still loaded; affected fields may
            show as “—”.
          </p>
        </div>
        <ul className="max-h-72 overflow-y-auto py-1">
          {issues.slice(0, LIMIT).map((issue, i) => (
            <li key={i}>
              <button
                type="button"
                disabled={issue.entryId === null}
                onClick={() => issue.entryId !== null && inspect(issue.entryId)}
                className="flex w-full items-start gap-2 px-3 py-1.5 text-left text-xs outline-none focus-visible:bg-muted enabled:hover:bg-muted"
              >
                <span
                  className={cn(
                    'mt-1 size-1.5 shrink-0 rounded-full',
                    issue.level === 'error' ? 'bg-danger' : 'bg-warning',
                  )}
                />
                <span className="w-10 shrink-0 font-mono text-subtle-foreground">
                  {issue.entryId === null ? 'log' : `#${issue.entryId + 1}`}
                </span>
                <span>{issue.message}</span>
              </button>
            </li>
          ))}
          {issues.length > LIMIT && (
            <li className="px-3 py-1.5 text-xs text-subtle-foreground">…and {issues.length - LIMIT} more</li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
