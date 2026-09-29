import { highlight, useFindQuery } from '@/components/find-query'
import { cn } from '@/lib/cn'
import { tokenizeLine, type Language } from './syntax'

interface SourceViewProps {
  text: string
  language: Language
  wrap: boolean
  lineNumbers: boolean
}

/**
 * Line-based source rendering. `cv-auto` (content-visibility) lets the browser skip layout
 * and paint for off-screen lines, which keeps multi-megabyte bodies responsive.
 */
export function SourceView({ text, language, wrap, lineNumbers }: SourceViewProps) {
  const query = useFindQuery()
  const lines = text.split('\n')
  const gutter = `${String(lines.length).length + 1}ch`

  return (
    <div className={cn('py-2 font-mono text-xs leading-5', !wrap && 'w-max min-w-full')}>
      {lines.map((line, i) => (
        <div key={i} className="flex cv-auto hover:bg-muted/40">
          {lineNumbers && (
            <span
              className="shrink-0 pr-3 pl-2 text-right text-subtle-foreground tabular select-none"
              style={{ width: `calc(${gutter} + 1.25rem)` }}
            >
              {i + 1}
            </span>
          )}
          <span
            className={cn(
              'min-w-0 flex-1 pr-4',
              !lineNumbers && 'pl-3',
              wrap ? 'break-all whitespace-pre-wrap' : 'whitespace-pre',
            )}
          >
            {tokenizeLine(line, language).map((token, t) => (
              <span key={t} className={token.className}>
                {highlight(token.text, query)}
              </span>
            ))}
            {line === '' && ' '}
          </span>
        </div>
      ))}
    </div>
  )
}
