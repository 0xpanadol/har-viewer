import { createContext, use, type ReactNode } from 'react'

/** The inspector's find query; every <Highlight> below the provider marks matches. */
export const FindQueryContext = createContext('')

export const MIN_QUERY = 2

export function useFindQuery(): string {
  return use(FindQueryContext)
}

export function matchesQuery(text: string, query: string): boolean {
  return query.length >= MIN_QUERY && text.toLowerCase().includes(query.toLowerCase())
}

/** Narrows name/value rows to find matches while a query is active — like DevTools' header filter. */
export function useFindFilter<T extends { name: string; value: string }>(items: readonly T[]): readonly T[] {
  const query = useFindQuery()
  if (query.length < MIN_QUERY) return items
  return items.filter((i) => matchesQuery(i.name, query) || matchesQuery(i.value, query))
}

/** Wraps case-insensitive matches in <mark data-hl>; find navigation walks those marks in DOM order. */
export function highlight(text: string, query: string): ReactNode {
  if (query.length < MIN_QUERY || !text) return text
  const lower = text.toLowerCase()
  const needle = query.toLowerCase()
  let index = lower.indexOf(needle)
  if (index === -1) return text

  const parts: ReactNode[] = []
  let cursor = 0
  while (index !== -1) {
    if (index > cursor) parts.push(text.slice(cursor, index))
    parts.push(
      <mark key={index} data-hl="">
        {text.slice(index, index + needle.length)}
      </mark>,
    )
    cursor = index + needle.length
    index = lower.indexOf(needle, cursor)
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}
