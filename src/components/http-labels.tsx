import { statusGroup } from '@/har/parse'
import { cn } from '@/lib/cn'
import { STATUS_DOT, STATUS_TEXT } from './status-colors'

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-method-get',
  POST: 'text-method-post',
  PUT: 'text-method-put',
  PATCH: 'text-method-put',
  DELETE: 'text-method-delete',
}

export function MethodLabel({ method, className }: { method: string; className?: string }) {
  return (
    <span
      className={cn(
        'font-mono text-xs font-medium',
        METHOD_COLORS[method] ?? 'text-muted-foreground',
        className,
      )}
    >
      {method}
    </span>
  )
}

interface StatusProps {
  status: number
  statusText?: string
  className?: string
}

/** Dot + code; color is never the only signal (the code is always printed). */
export function StatusCode({ status, statusText, className }: StatusProps) {
  const group = statusGroup(status)
  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-1.5 font-mono text-xs tabular',
        STATUS_TEXT[group],
        className,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', STATUS_DOT[group])} aria-hidden />
      <span>{status || 'failed'}</span>
      {statusText && <span className="truncate font-sans text-muted-foreground">{statusText}</span>}
    </span>
  )
}

/** Host de-emphasized, path in full ink — the pattern used by Stripe/Vercel request logs. */
export function UrlText({ host, path, className }: { host: string; path: string; className?: string }) {
  return (
    <span className={cn('min-w-0 truncate font-mono text-xs', className)}>
      <span className="text-subtle-foreground">{host}</span>
      <span className="text-foreground">{path}</span>
    </span>
  )
}
