import type { FacetKind } from '@/har/facets'
import {
  EMPTY_CRITERIA,
  type FilterCriteria,
  type SearchScope,
  type SortColumn,
  type SortState,
} from '@/har/filter'
import type { SliceCreator } from './types'

export interface SavedView {
  id: string
  name: string
  criteria: Omit<FilterCriteria, 'timeWindow'>
}

export interface FilterSlice extends FilterCriteria {
  sort: SortState
  savedViews: SavedView[]

  setQuery: (query: string) => void
  setUseRegex: (value: boolean) => void
  setNegate: (value: boolean) => void
  setScope: (scope: SearchScope) => void
  toggleFacet: (kind: FacetKind, value: string) => void
  setFacet: (kind: FacetKind, values: string[]) => void
  setTimeRange: (min: number | null, max: number | null) => void
  setSizeRange: (min: number | null, max: number | null) => void
  setTimeWindow: (window: [number, number] | null) => void
  applyCriteria: (criteria: Partial<FilterCriteria>) => void
  resetFilters: () => void
  cycleSort: (column: SortColumn) => void
  saveView: (name: string) => void
  applyView: (id: string) => void
  deleteView: (id: string) => void
}

export const createFilterSlice: SliceCreator<FilterSlice> = (set, get) => ({
  ...EMPTY_CRITERIA,
  sort: { column: null, direction: 'asc' },
  savedViews: [],

  setQuery: (query) => set({ query }),
  setUseRegex: (useRegex) => set({ useRegex }),
  setNegate: (negate) => set({ negate }),
  setScope: (scope) => set({ scope }),

  toggleFacet: (kind, value) => {
    const current = get()[kind]
    set({ [kind]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] })
  },
  setFacet: (kind, values) => set({ [kind]: values }),

  setTimeRange: (minTime, maxTime) => set({ minTime, maxTime }),
  setSizeRange: (minSize, maxSize) => set({ minSize, maxSize }),
  setTimeWindow: (timeWindow) => set({ timeWindow }),

  applyCriteria: (criteria) => set(criteria),
  resetFilters: () => set({ ...EMPTY_CRITERIA }),

  // asc → desc → unsorted (capture order)
  cycleSort: (column) => {
    const { sort } = get()
    if (sort.column !== column) set({ sort: { column, direction: 'asc' } })
    else if (sort.direction === 'asc') set({ sort: { column, direction: 'desc' } })
    else set({ sort: { column: null, direction: 'asc' } })
  },

  saveView: (name) => {
    const s = get()
    const view: SavedView = {
      id: crypto.randomUUID(),
      name,
      criteria: {
        query: s.query,
        useRegex: s.useRegex,
        negate: s.negate,
        scope: s.scope,
        methods: s.methods,
        statuses: s.statuses,
        types: s.types,
        domains: s.domains,
        minTime: s.minTime,
        maxTime: s.maxTime,
        minSize: s.minSize,
        maxSize: s.maxSize,
      },
    }
    set({ savedViews: [...s.savedViews, view] })
  },

  applyView: (id) => {
    const view = get().savedViews.find((v) => v.id === id)
    if (view) set({ ...EMPTY_CRITERIA, ...view.criteria })
  },

  deleteView: (id) => set({ savedViews: get().savedViews.filter((v) => v.id !== id) }),
})
