import { useShallow } from 'zustand/react/shallow'
import { computeFacets } from '@/har/facets'
import { applyTimeWindow, filterEntries, pinFirst, sortEntries, type FilterCriteria } from '@/har/filter'
import { detectIssues, issueCount } from '@/har/issues'
import type { Entry } from '@/har/types'
import { memoizeOne } from '@/lib/memo'
import { useAppStore, type AppState } from './index'

/*
 * Derived data is computed once per relevant state change and shared by every subscriber.
 * Each selector is memoized on the exact state fields it reads, so it returns a stable
 * reference (no re-render) when unrelated state changes.
 */

const criteriaOf = memoizeOne(
  (
    query: string,
    useRegex: boolean,
    negate: boolean,
    scope: FilterCriteria['scope'],
    methods: string[],
    statuses: string[],
    types: string[],
    domains: string[],
    minTime: number | null,
    maxTime: number | null,
    minSize: number | null,
    maxSize: number | null,
    timeWindow: [number, number] | null,
  ): FilterCriteria => ({
    query,
    useRegex,
    negate,
    scope,
    methods,
    statuses,
    types,
    domains,
    minTime,
    maxTime,
    minSize,
    maxSize,
    timeWindow,
  }),
)

export const selectCriteria = (s: AppState): FilterCriteria =>
  criteriaOf(
    s.query,
    s.useRegex,
    s.negate,
    s.scope,
    s.methods,
    s.statuses,
    s.types,
    s.domains,
    s.minTime,
    s.maxTime,
    s.minSize,
    s.maxSize,
    s.timeWindow,
  )

const facetFiltered = memoizeOne((entries: Entry[], c: FilterCriteria) => filterEntries(entries, c))

/** Every filter except the time window — what the histogram plots. */
export const selectFilteredEntries = (s: AppState): Entry[] => facetFiltered(s.entries, selectCriteria(s))

const visible = memoizeOne(
  (
    base: Entry[],
    window: FilterCriteria['timeWindow'],
    start: number,
    sort: AppState['sort'],
    pinned: ReadonlySet<number>,
  ) => pinFirst(sortEntries(applyTimeWindow(base, window, start), sort), pinned),
)

const asSet = () => memoizeOne((ids: number[]) => new Set(ids))
const checkedSet = asSet()
const pinnedSet = asSet()

export const selectCheckedSet = (s: AppState) => checkedSet(s.checkedIds)
export const selectPinnedSet = (s: AppState) => pinnedSet(s.pinnedIds)

/** The rows on screen: filtered, windowed, sorted, pinned first. */
export const selectVisibleEntries = (s: AppState): Entry[] =>
  visible(selectFilteredEntries(s), s.timeWindow, s.range.start, s.sort, selectPinnedSet(s))

const byId = memoizeOne((entries: Entry[]) => new Map(entries.map((e) => [e.id, e])))
export const selectEntryMap = (s: AppState) => byId(s.entries)

export const selectSelectedEntry = (s: AppState): Entry | undefined =>
  s.selectedId === null ? undefined : selectEntryMap(s).get(s.selectedId)

const duplicates = memoizeOne((entries: Entry[]) => {
  const seen = new Map<string, number>()
  for (const e of entries) seen.set(`${e.method} ${e.url}`, (seen.get(`${e.method} ${e.url}`) ?? 0) + 1)
  return new Set([...seen].filter(([, n]) => n > 1).map(([key]) => key))
})
export const selectDuplicateKeys = (s: AppState) => duplicates(s.entries)

const facets = memoizeOne(computeFacets)
export const selectFacets = (s: AppState) => facets(s.entries)

const issues = memoizeOne(detectIssues)
export const selectIssues = (s: AppState) => issues(s.entries)

const issueTotal = memoizeOne(issueCount)
export const selectIssueCount = (s: AppState) => issueTotal(selectIssues(s))

/* ─── Hooks ─── */

export const useVisibleEntries = () => useAppStore(selectVisibleEntries)
export const useFilteredEntries = () => useAppStore(selectFilteredEntries)
export const useSelectedEntry = () => useAppStore(selectSelectedEntry)
export const useCriteria = () => useAppStore(selectCriteria)
export const useHasCapture = () => useAppStore((s) => s.log !== null)

export function useEntryFlags(id: number) {
  return useAppStore(
    useShallow((s) => ({
      checked: selectCheckedSet(s).has(id),
      pinned: selectPinnedSet(s).has(id),
      note: s.notes[id]?.text,
    })),
  )
}
