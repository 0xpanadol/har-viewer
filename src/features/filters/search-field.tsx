import { ChevronDown, EqualNot, Regex, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InputGroup } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import { Toggle } from '@/components/ui/tabs'
import { Tooltip } from '@/components/ui/tooltip'
import { isValidRegex, type SearchScope } from '@/har/filter'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/store'

export const SEARCH_INPUT_ID = 'request-search'

const SCOPES: ReadonlyArray<{ id: SearchScope; label: string; hint: string }> = [
  { id: 'url', label: 'URL', hint: 'Method, URL, status and type' },
  { id: 'headers', label: 'Headers', hint: 'Request and response headers' },
  { id: 'body', label: 'Bodies', hint: 'Request payloads and response bodies' },
  { id: 'all', label: 'Everything', hint: 'All of the above' },
]

/** Large captures debounce so typing never waits on a full re-filter. */
const LARGE_CAPTURE = 3000

export function SearchField({ className }: { className?: string }) {
  const query = useAppStore((s) => s.query)
  const setQuery = useAppStore((s) => s.setQuery)
  const useRegex = useAppStore((s) => s.useRegex)
  const setUseRegex = useAppStore((s) => s.setUseRegex)
  const negate = useAppStore((s) => s.negate)
  const setNegate = useAppStore((s) => s.setNegate)
  const scope = useAppStore((s) => s.scope)
  const setScope = useAppStore((s) => s.setScope)
  const large = useAppStore((s) => s.entries.length > LARGE_CAPTURE)

  const [draft, setDraft] = useState(query)
  const [synced, setSynced] = useState(query)
  if (query !== synced) {
    // Store changed from elsewhere (reset, saved view, shared link) — adopt it.
    setSynced(query)
    setDraft(query)
  }

  useEffect(() => {
    if (draft === query) return
    const timer = setTimeout(() => setQuery(draft), large ? 180 : 0)
    return () => clearTimeout(timer)
  }, [draft, query, large, setQuery])

  const invalid = useRegex && draft !== '' && !isValidRegex(draft)
  const scopeLabel = SCOPES.find((s) => s.id === scope)?.label ?? 'URL'

  return (
    <InputGroup
      className={cn(
        'w-full',
        invalid && 'border-danger focus-within:border-danger focus-within:ring-danger/20',
        className,
      )}
      leading={<Search />}
      trailing={
        <>
          {draft ? (
            <Button variant="ghost" size="icon-xs" onClick={() => setDraft('')} aria-label="Clear search">
              <X />
            </Button>
          ) : (
            <Kbd className="mr-1 hidden sm:inline-flex">/</Kbd>
          )}
          <Tooltip content={useRegex ? 'Regular expression: on' : 'Match as regular expression'}>
            <Toggle pressed={useRegex} onPressedChange={setUseRegex} aria-label="Use regular expression">
              <Regex />
            </Toggle>
          </Tooltip>
          <Tooltip content={negate ? 'Showing non-matches' : 'Invert — show requests that don’t match'}>
            <Toggle pressed={negate} onPressedChange={setNegate} aria-label="Invert match">
              <EqualNot />
            </Toggle>
          </Tooltip>
          <span className="mx-0.5 h-4 w-px bg-border" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                className="gap-1 px-1.5 text-muted-foreground"
                aria-label="Search scope"
              >
                {scopeLabel}
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Search in</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={scope} onValueChange={(v) => setScope(v as SearchScope)}>
                {SCOPES.map((s) => (
                  <DropdownMenuRadioItem key={s.id} value={s.id} className="h-auto py-1.5">
                    <span className="flex flex-col">
                      <span>{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.hint}</span>
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    >
      <input
        id={SEARCH_INPUT_ID}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return
          if (draft) setDraft('')
          else e.currentTarget.blur()
        }}
        placeholder={useRegex ? 'Filter with a regular expression…' : 'Filter requests…'}
        spellCheck={false}
        autoComplete="off"
        aria-label="Filter requests"
        aria-invalid={invalid}
        className={cn(useRegex && 'font-mono')}
      />
    </InputGroup>
  )
}
