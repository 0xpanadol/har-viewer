import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InputGroup } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import { MIN_QUERY } from '@/components/find-query'
import { MOD } from '@/lib/platform'

export const FIND_INPUT_ID = 'inspector-find'

interface FindBarProps {
  query: string
  onQueryChange: (query: string) => void
  count: number
  index: number
  onNext: () => void
  onPrevious: () => void
}

export function FindBar({ query, onQueryChange, count, index, onNext, onPrevious }: FindBarProps) {
  const searching = query.length >= MIN_QUERY
  return (
    <div className="shrink-0 border-b px-3 py-2">
      <InputGroup
        leading={<Search />}
        trailing={
          <>
            {searching ? (
              <span
                className="px-1 text-xs whitespace-nowrap text-muted-foreground tabular"
                aria-live="polite"
              >
                {count ? `${index + 1} of ${count}` : 'No results'}
              </span>
            ) : (
              <Kbd className="mr-1 hidden sm:inline-flex">{MOD} F</Kbd>
            )}
            {query && (
              <>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onPrevious}
                  disabled={!count}
                  aria-label="Previous match"
                >
                  <ChevronUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onNext}
                  disabled={!count}
                  aria-label="Next match"
                >
                  <ChevronDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onQueryChange('')}
                  aria-label="Clear find"
                >
                  <X />
                </Button>
              </>
            )}
          </>
        }
      >
        <input
          id={FIND_INPUT_ID}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (e.shiftKey) onPrevious()
              else onNext()
            } else if (e.key === 'Escape') {
              e.stopPropagation()
              if (query) onQueryChange('')
              else e.currentTarget.blur()
            }
          }}
          placeholder="Find in headers, payload, response…"
          spellCheck={false}
          autoComplete="off"
          aria-label="Find in request"
        />
      </InputGroup>
    </div>
  )
}
