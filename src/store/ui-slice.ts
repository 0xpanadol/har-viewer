import type { InspectorTab } from '@/har/search'
import type { SliceCreator } from './types'

export type ThemePreference = 'system' | 'light' | 'dark'

export type ViewId = 'requests' | 'waterfall' | 'timeline' | 'overview' | 'issues' | 'initiators' | 'compare'

export type ColumnId = 'method' | 'url' | 'status' | 'type' | 'size' | 'time' | 'waterfall'

export const DEFAULT_COLUMNS: Record<ColumnId, boolean> = {
  method: true,
  url: true,
  status: true,
  type: true,
  size: true,
  time: true,
  waterfall: true,
}

/** Modal surfaces are mutually exclusive, so one discriminated union models them all. */
export type DialogState =
  | { type: 'none' }
  | { type: 'palette' }
  | { type: 'shortcuts' }
  | { type: 'note'; entryId: number }
  | { type: 'diff'; ids: [number, number] }
  | { type: 'replay'; entryId: number }

export interface UiSlice {
  theme: ThemePreference
  view: ViewId
  inspectorOpen: boolean
  inspectorTab: InspectorTab
  sidebarOpen: boolean
  columns: Record<ColumnId, boolean>
  urlPreviews: boolean
  scrollTop: number
  dialog: DialogState

  setTheme: (theme: ThemePreference) => void
  setView: (view: ViewId) => void
  setInspectorOpen: (open: boolean) => void
  setInspectorTab: (tab: InspectorTab) => void
  setSidebarOpen: (open: boolean) => void
  toggleColumn: (column: ColumnId) => void
  setUrlPreviews: (enabled: boolean) => void
  setScrollTop: (top: number) => void
  openDialog: (dialog: Exclude<DialogState, { type: 'none' }>) => void
  closeDialog: () => void
}

export const createUiSlice: SliceCreator<UiSlice> = (set, get) => ({
  theme: 'system',
  view: 'requests',
  inspectorOpen: false,
  inspectorTab: 'headers',
  sidebarOpen: true,
  columns: DEFAULT_COLUMNS,
  urlPreviews: true,
  scrollTop: 0,
  dialog: { type: 'none' },

  setTheme: (theme) => set({ theme }),
  setView: (view) => set({ view }),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen: inspectorOpen && get().selectedId !== null }),
  setInspectorTab: (inspectorTab) => set({ inspectorTab }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleColumn: (column) => set({ columns: { ...get().columns, [column]: !get().columns[column] } }),
  setUrlPreviews: (urlPreviews) => set({ urlPreviews }),
  setScrollTop: (scrollTop) => set({ scrollTop }),
  openDialog: (dialog) => set({ dialog }),
  closeDialog: () => set({ dialog: { type: 'none' } }),
})
