import { EMPTY_CRITERIA } from '@/har/filter'
import { captureRange, growRange, toEntries, toEntry } from '@/har/parse'
import type { CaptureRange, Entry, HarEntry, HarLog, ValidationIssue, WebSocketMessage } from '@/har/types'
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

export type CaptureSource = 'file' | 'live'
export type LiveStatus = 'connecting' | 'open' | 'closed'
export interface LiveInfo {
  status: LiveStatus
  label: string
}
export interface LiveEntry {
  id: number
  entry: HarEntry
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

  source: CaptureSource
  live: LiveInfo | null
  setLoading: (loading: LoadingState | null) => void
  openCapture: (input: OpenCaptureInput) => void
  closeCapture: () => void
  removeEntries: (ids: readonly number[], nextSelectedId: number | null) => void
  undoRemove: () => boolean
  markSaved: () => void
  setComparison: (comparison: Comparison | null) => void
  setLive: (live: LiveInfo | null) => void
  openLive: (input: { label: string; creator?: { name: string; version: string } }) => void
  snapshotLive: (entries: readonly LiveEntry[]) => void
  upsertLiveEntries: (entries: readonly LiveEntry[]) => void
  appendLiveWsMessages: (id: number, messages: readonly WebSocketMessage[]) => void
  removeLiveEntries: (ids: readonly number[]) => void
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

  source: 'file',
  live: null,
  setLoading: (loading) => set({ loading }),

  openCapture: ({ log, fileName, ids, restore = false }) => {
    const entries = toEntries(log, ids)
    set({
      source: 'file',
      live: null,
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
      source: 'file',
      live: null,
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

  setLive: (live) => set({ live }),

  openLive: ({ label, creator }) => {
    const wasLive = get().source === 'live'
    if (wasLive) {
      set({ live: { status: 'open', label }, fileName: label })
      return
    }
    set({
      source: 'live',
      live: { status: 'open', label },
      fileName: label,
      log: { version: '1.2', creator, pages: [], entries: [] },
      entries: [],
      range: { start: 0, end: 0 },
      validation: [],
      isDirty: false,
      undoStack: [],
      comparison: null,
      loading: null,
      ...RESET_PER_FILE,
      ...EMPTY_CRITERIA,
      view: 'requests' as const,
    })
  },

  snapshotLive: (incoming) => {
    if (get().source !== 'live') return
    const entries = incoming.map(({ id, entry }) => toEntry(entry, id))
    const present = new Set(entries.map((e) => e.id))
    const { selectedId, checkedIds, inspectorOpen } = get()
    const nextSelected = selectedId !== null && present.has(selectedId) ? selectedId : null
    set({
      entries,
      range: captureRange(entries),
      selectedId: nextSelected,
      inspectorOpen: nextSelected !== null && inspectorOpen,
      checkedIds: checkedIds.filter((id) => present.has(id)),
    })
  },

  upsertLiveEntries: (incoming) => {
    if (get().source !== 'live' || incoming.length === 0) return
    const { entries, range } = get()
    const existingById = new Map(entries.map((e) => [e.id, e]))
    const byId = new Map<number, Entry>()
    for (const { id, entry } of incoming) {
      const raw =
        entry._webSocketMessages === undefined && existingById.has(id)
          ? { ...entry, _webSocketMessages: existingById.get(id)!.raw._webSocketMessages }
          : entry
      byId.set(id, toEntry(raw, id))
    }
    const replaced = new Set<number>()
    const nextEntries = entries.map((e) => {
      const updated = byId.get(e.id)
      if (!updated) return e
      replaced.add(e.id)
      return updated
    })
    for (const [id, e] of byId) {
      if (!replaced.has(id)) nextEntries.push(e)
    }
    let nextRange = range
    for (const e of byId.values()) nextRange = growRange(nextRange, e)
    set({ entries: nextEntries, range: nextRange })
  },

  appendLiveWsMessages: (id, messages) => {
    if (get().source !== 'live' || messages.length === 0) return
    const { entries } = get()
    const idx = entries.findIndex((e) => e.id === id)
    if (idx === -1) return
    const current = entries[idx]!
    const updated: Entry = {
      ...current,
      raw: {
        ...current.raw,
        _webSocketMessages: [...(current.raw._webSocketMessages ?? []), ...messages],
      },
    }
    const nextEntries = entries.slice()
    nextEntries[idx] = updated
    set({ entries: nextEntries })
  },

  removeLiveEntries: (ids) => {
    if (get().source !== 'live' || ids.length === 0) return
    const doomed = new Set(ids)
    const { entries, selectedId, checkedIds } = get()
    const dropSelected = selectedId !== null && doomed.has(selectedId)
    set({
      entries: entries.filter((e) => !doomed.has(e.id)),
      checkedIds: checkedIds.filter((id) => !doomed.has(id)),
      ...(dropSelected ? { selectedId: null, inspectorOpen: false } : {}),
    })
  },
})
