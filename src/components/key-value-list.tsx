import { decodeHint } from '@/har/decode'
import { cn } from '@/lib/cn'
import { CopyButton } from './copy-button'
import { useFindFilter } from './find-query'
import { Highlight } from './highlight'

export interface KeyValue {
  name: string
  value: string
}

interface KeyValueListProps {
  items: readonly KeyValue[]
  /** Show URL/base64 decodings under opaque values. */
  decode?: boolean
  empty?: string
  className?: string
}

export function KeyValueList({ items, decode, empty = 'None', className }: KeyValueListProps) {
  const rows = useFindFilter(items)
  if (!rows.length)
    return <p className="px-3 text-xs text-subtle-foreground">{items.length ? 'No matches' : empty}</p>

  return (
    <dl className={cn('grid grid-cols-[minmax(96px,34%)_1fr] font-mono text-xs', className)}>
      {rows.map((item, i) => {
        const hint = decode ? decodeHint(item.value) : null
        return (
          <div
            key={`${item.name}-${i}`}
            className="group/row col-span-2 grid grid-cols-subgrid items-start px-3 py-[3px] hover:bg-muted/60"
          >
            <dt className="truncate py-0.5 pr-3 text-muted-foreground" title={item.name}>
              <Highlight text={item.name} />
            </dt>
            <dd className="relative min-w-0 py-0.5 pr-6 break-all text-foreground">
              <Highlight text={item.value} />
              {hint && (
                <span className="mt-0.5 block text-subtle-foreground">
                  <span className="mr-1 rounded-sm bg-muted px-1 font-sans text-2xs">
                    {hint.kind === 'url' ? 'decoded' : 'base64'}
                  </span>
                  <Highlight text={hint.text} />
                </span>
              )}
              <CopyButton
                value={item.value}
                label={`Copy ${item.name}`}
                className="absolute -top-0.5 right-0 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
              />
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
