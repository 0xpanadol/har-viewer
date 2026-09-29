import { useEffect, useState, type RefObject } from 'react'

const MARKS = 'mark[data-hl]'

/**
 * Browser-style find over whatever <Highlight> rendered inside the container: counts the
 * marks, tracks the active one and scrolls it into view. `scope` (e.g. the active tab)
 * resets the position when the content is swapped out.
 */
export function useFindNavigation(containerRef: RefObject<HTMLElement | null>, query: string, scope: string) {
  const [count, setCount] = useState(0)
  const [active, setActive] = useState(0)
  const [lastScope, setLastScope] = useState(scope)
  const [lastQuery, setLastQuery] = useState(query)

  if (scope !== lastScope || query !== lastQuery) {
    setLastScope(scope)
    setLastQuery(query)
    setActive(0)
  }

  // Recount whenever the rendered content changes (tab switch, sections toggled, lazy content).
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const sync = () => setCount(el.querySelectorAll(MARKS).length)
    const observer = new MutationObserver(sync)
    observer.observe(el, { childList: true, subtree: true, characterData: true })
    const frame = requestAnimationFrame(sync)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [containerRef])

  const index = count ? Math.min(active, count - 1) : 0

  // Flag the active match (attribute changes are not observed, so this can't loop).
  useEffect(() => {
    const marks = containerRef.current?.querySelectorAll<HTMLElement>(MARKS)
    marks?.forEach((mark, i) => mark.toggleAttribute('data-active', i === index))
  }, [containerRef, index, count, query])

  // Reveal it — only on navigation, query or scope change, never on unrelated re-renders.
  useEffect(() => {
    const target = containerRef.current?.querySelectorAll<HTMLElement>(MARKS)[index]
    target?.scrollIntoView({ block: 'center' })
  }, [containerRef, index, query, scope])

  return {
    count,
    index,
    next: () => count && setActive((index + 1) % count),
    previous: () => count && setActive((index - 1 + count) % count),
  }
}
