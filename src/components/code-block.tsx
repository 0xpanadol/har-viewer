import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/cn'
import { CopyButton } from './copy-button'
import { Highlight } from './highlight'

const MAX_CHARS = 500_000

export function CodeBlock({ content, className }: { content: string; className?: string }) {
  const truncated = content.length > MAX_CHARS
  const display = truncated ? content.slice(0, MAX_CHARS) : content
  return (
    <div className={cn('group/code relative mx-3 rounded-md border bg-muted/40', className)}>
      <pre className="max-h-[480px] overflow-auto p-3 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
        <Highlight text={display} />
        {truncated && (
          <span className="text-subtle-foreground">{`\n\n… truncated — ${formatBytes(content.length)} total`}</span>
        )}
      </pre>
      <CopyButton
        value={content}
        className="absolute top-1.5 right-1.5 bg-popover opacity-0 shadow-sm group-hover/code:opacity-100 focus-visible:opacity-100"
      />
    </div>
  )
}
