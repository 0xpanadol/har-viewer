import type { InspectorTab } from '@/har/search'
import type { SliceCreator } from './types'

export interface Note {
  text: string
  updatedAt: number
}

export interface SelectionSlice {
  /** The request shown in the inspector. */
  selectedId: number | null
  /** Rows ticked for bulk actions. */
  checkedIds: number[]
  pinnedIds: number[]
  notes: Record<number, Note>

  /** Moves the selection without changing whether the inspector is open. */
  select: (id: number) => void
  inspect: (id: number, tab?: InspectorTab) => void
  clearSelection: () => void
  toggleChecked: (id: number) => void
  setChecked: (ids: readonly number[], checked: boolean) => void
  clearChecked: () => void
  togglePinned: (id: number) => void
  setNote: (id: number, text: string) => void
  removeNote: (id: number) => void
}

export const createSelectionSlice: SliceCreator<SelectionSlice> = (set, get) => ({
  selectedId: null,
  checkedIds: [],
  pinnedIds: [],
  notes: {},

  select: (id) => set({ selectedId: id }),
  inspect: (id, tab) => set({ selectedId: id, inspectorOpen: true, ...(tab ? { inspectorTab: tab } : {}) }),
  clearSelection: () => set({ selectedId: null, inspectorOpen: false }),

  toggleChecked: (id) => {
    const ids = get().checkedIds
    set({ checkedIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] })
  },

  setChecked: (ids, checked) => {
    const next = new Set(get().checkedIds)
    for (const id of ids) {
      if (checked) next.add(id)
      else next.delete(id)
    }
    set({ checkedIds: [...next] })
  },

  clearChecked: () => set({ checkedIds: [] }),

  togglePinned: (id) => {
    const ids = get().pinnedIds
    set({ pinnedIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] })
  },

  setNote: (id, text) => set({ notes: { ...get().notes, [id]: { text, updatedAt: Date.now() } } }),

  removeNote: (id) => {
    const { [id]: _removed, ...rest } = get().notes
    set({ notes: rest })
  },
})
