import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createCaptureSlice } from './capture-slice'
import { createFilterSlice } from './filter-slice'
import { createSelectionSlice } from './selection-slice'
import type { AppState } from './types'
import { createUiSlice, DEFAULT_COLUMNS } from './ui-slice'

export const STORAGE_KEY = 'har-viewer:state'

/** What survives a reload. Capture data itself lives in IndexedDB (see services/session). */
function persisted(s: AppState) {
  return {
    theme: s.theme,
    view: s.view,
    inspectorOpen: s.inspectorOpen,
    inspectorTab: s.inspectorTab,
    sidebarOpen: s.sidebarOpen,
    columns: s.columns,
    urlPreviews: s.urlPreviews,
    scrollTop: s.scrollTop,
    fileName: s.fileName,
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
    timeWindow: s.timeWindow,
    sort: s.sort,
    savedViews: s.savedViews,
    selectedId: s.selectedId,
    checkedIds: s.checkedIds,
    pinnedIds: s.pinnedIds,
    notes: s.notes,
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createCaptureSlice(...a),
      ...createFilterSlice(...a),
      ...createSelectionSlice(...a),
      ...createUiSlice(...a),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: persisted,
      merge: (stored, current) => {
        const state = (stored ?? {}) as Partial<AppState>
        return { ...current, ...state, columns: { ...DEFAULT_COLUMNS, ...state.columns } }
      },
    },
  ),
)

export type { AppState } from './types'
