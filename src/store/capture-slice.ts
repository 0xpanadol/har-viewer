import { EMPTY_CRITERIA } from '@/har/filter'
import { captureRange, toEntries } from '@/har/parse'
import type { CaptureRange, Entry, HarLog, ValidationIssue } from '@/har/types'
import { validateHar } from '@/har/validate'
import type { SliceCreator } from './types'

const UNDO_LIMIT = 20

export interface LoadingState {
  label: string
  detail?: string
  /** 0–1, or null for indeterminate. */
  progress: number | null
}

export interface Comparison {
  fileName: string
  entries: Entry[]
}

export interface OpenCaptureInput {
  log: HarLog
  fileName: string
  /** Stable ids from a persisted session. */
  ids?: number[]
  /** Restoring keeps the persisted selection and filters instead of resetting them. */
  restore?: boolean
}

export interface CaptureSlice {
  fileName: string
  log: HarLog | null
  entries: Entry[]
  range: CaptureRange
  validation: ValidationIssue[]
  /** Deletions not yet committed to the saved session. */
  isDirty: boolean
  undoStack: Entry[][]
  comparison: Comparison | null
  loading: LoadingState | null

  setLoading: (loading: LoadingState | null) => void
  openCapture: (input: OpenCaptureInput) => void
  closeCapture: () => void
  removeEntries: (ids: readonly number[], nextSelectedId: number | null) => void
  undoRemove: () => boolean
  markSaved: () => void
  setComparison: (comparison: Comparison | null) => void
}

const RESET_PER_FILE = {
  selectedId: null,
  checkedIds: [],
  pinnedIds: [],
  notes: {},
  scrollTop: 0,
  inspectorOpen: false,
}

export const createCaptureSlice: SliceCreator<CaptureSlice> = (set, get) => ({
  fileName: '',
  log: null,
  entries: [],
  range: { start: 0, end: 0 },
  validation: [],
  isDirty: false,
  undoStack: [],
  comparison: null,
  loading: null,

  setLoading: (loading) => set({ loading }),

  openCapture: ({ log, fileName, ids, restore = false }) => {
    const entries = toEntries(log, ids)
    set({
      log,
      fileName,
      entries,
      range: captureRange(entries),
      validation: validateHar(log),
      isDirty: false,
      undoStack: [],
      comparison: null,
      loading: null,
      ...(restore ? {} : { ...RESET_PER_FILE, ...EMPTY_CRITERIA, view: 'requests' as const }),
    })
  },

  closeCapture: () =>
    set({
      log: null,
      fileName: '',
      entries: [],
      range: { start: 0, end: 0 },
      validation: [],
      isDirty: false,
      undoStack: [],
      comparison: null,
      ...RESET_PER_FILE,
      ...EMPTY_CRITERIA,
    }),

  removeEntries: (ids, nextSelectedId) => {
    const doomed = new Set(ids)
    const { entries, undoStack, selectedId, checkedIds } = get()
    set({
      entries: entries.filter((e) => !doomed.has(e.id)),
      undoStack: [...undoStack.slice(-(UNDO_LIMIT - 1)), entries],
      isDirty: true,
      checkedIds: checkedIds.filter((id) => !doomed.has(id)),
      ...(selectedId !== null && doomed.has(selectedId)
        ? { selectedId: nextSelectedId, inspectorOpen: nextSelectedId !== null && get().inspectorOpen }
        : {}),
    })
  },

  undoRemove: () => {
    const { undoStack } = get()
    const previous = undoStack.at(-1)
    if (!previous) return false
    set({ entries: previous, undoStack: undoStack.slice(0, -1), isDirty: undoStack.length > 1 })
    return true
  },

  markSaved: () => set({ isDirty: false }),

  setComparison: (comparison) => set({ comparison }),
})
