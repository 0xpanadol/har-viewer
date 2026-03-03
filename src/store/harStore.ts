import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HarLog, ParsedEntry, SortColumn, SortDirection, DetailTab } from '../utils/types'
import { parseHarEntries } from '../utils/parsers'
import { saveHarData as saveToIDB, clearHarData as clearFromIDB } from '../utils/storage'

interface HarState {
  // Data (not persisted — reloaded from file)
  harData: HarLog | null
  allEntries: ParsedEntry[]
  fileName: string

  // UI state (persisted)
  selectedIdx: number
  sortCol: SortColumn
  sortDir: SortDirection
  activeMethodFilters: string[]
  activeStatusFilters: string[]
  activeTypeFilters: string[]
  checkedEntries: number[]
  searchQuery: string
  detailPanelWidth: number
  detailPanelOpen: boolean
  activeDetailTab: DetailTab
  scrollTop: number

  // Computed
  waterfallStart: number
  waterfallEnd: number

  // Actions
  loadHarData: (data: HarLog, fileName: string) => void
  restoreHarData: (data: HarLog) => void
  clearData: () => void
  setSelectedIdx: (idx: number) => void
  setSortCol: (col: SortColumn) => void
  setSortDir: (dir: SortDirection) => void
  toggleSort: (col: SortColumn) => void
  toggleMethodFilter: (method: string) => void
  toggleStatusFilter: (status: string) => void
  toggleTypeFilter: (type: string) => void
  toggleCheck: (idx: number) => void
  checkAll: (indices: number[]) => void
  uncheckAll: (indices: number[]) => void
  clearChecked: () => void
  setSearchQuery: (q: string) => void
  setDetailPanelWidth: (w: number) => void
  setDetailPanelOpen: (open: boolean) => void
  setActiveDetailTab: (tab: DetailTab) => void
  setScrollTop: (top: number) => void
}

export const useHarStore = create<HarState>()(
  persist(
    (set) => ({
      harData: null,
      allEntries: [],
      fileName: '',
      selectedIdx: -1,
      sortCol: 'none',
      sortDir: 'asc',
      activeMethodFilters: [],
      activeStatusFilters: [],
      activeTypeFilters: [],
      checkedEntries: [],
      searchQuery: '',
      detailPanelWidth: 420,
      detailPanelOpen: false,
      activeDetailTab: 'headers',
      scrollTop: 0,
      waterfallStart: 0,
      waterfallEnd: 0,

      loadHarData: (data, fileName) => {
        const log = (data as unknown as { log?: HarLog }).log || data
        const entries = parseHarEntries(log.entries || [])
        let wfStart = 0
        let wfEnd = 0
        if (entries.length) {
          wfStart = Math.min(...entries.map((e) => e.startTime))
          wfEnd = Math.max(...entries.map((e) => e.startTime + e.time))
        }
        set({
          harData: log,
          allEntries: entries,
          fileName,
          waterfallStart: wfStart,
          waterfallEnd: wfEnd,
        })
        // Persist raw HAR data to IndexedDB (async, fire-and-forget)
        saveToIDB(data)
      },

      restoreHarData: (data) => {
        const log = (data as unknown as { log?: HarLog }).log || data
        const entries = parseHarEntries(log.entries || [])
        let wfStart = 0
        let wfEnd = 0
        if (entries.length) {
          wfStart = Math.min(...entries.map((e) => e.startTime))
          wfEnd = Math.max(...entries.map((e) => e.startTime + e.time))
        }
        set({
          harData: log,
          allEntries: entries,
          waterfallStart: wfStart,
          waterfallEnd: wfEnd,
        })
      },

      clearData: () => {
        clearFromIDB()
        set({
          harData: null,
          allEntries: [],
          fileName: '',
          selectedIdx: -1,
          sortCol: 'none',
          sortDir: 'asc',
          activeMethodFilters: [],
          activeStatusFilters: [],
          activeTypeFilters: [],
          checkedEntries: [],
          searchQuery: '',
          detailPanelOpen: false,
          scrollTop: 0,
          waterfallStart: 0,
          waterfallEnd: 0,
        })
      },

      setSelectedIdx: (idx) => set({ selectedIdx: idx }),

      setSortCol: (col) => set({ sortCol: col }),
      setSortDir: (dir) => set({ sortDir: dir }),

      toggleSort: (col) =>
        set((state) => {
          if (state.sortCol === col) {
            if (state.sortDir === 'asc') return { sortDir: 'desc' }
            return { sortCol: 'none', sortDir: 'asc' }
          }
          return { sortCol: col, sortDir: 'asc' }
        }),

      toggleMethodFilter: (method) =>
        set((state) => {
          const filters = [...state.activeMethodFilters]
          const idx = filters.indexOf(method)
          if (idx >= 0) filters.splice(idx, 1)
          else filters.push(method)
          return { activeMethodFilters: filters }
        }),

      toggleStatusFilter: (status) =>
        set((state) => {
          const filters = [...state.activeStatusFilters]
          const idx = filters.indexOf(status)
          if (idx >= 0) filters.splice(idx, 1)
          else filters.push(status)
          return { activeStatusFilters: filters }
        }),

      toggleTypeFilter: (type) =>
        set((state) => {
          const filters = [...state.activeTypeFilters]
          const idx = filters.indexOf(type)
          if (idx >= 0) filters.splice(idx, 1)
          else filters.push(type)
          return { activeTypeFilters: filters }
        }),

      toggleCheck: (idx) =>
        set((state) => {
          const checked = [...state.checkedEntries]
          const pos = checked.indexOf(idx)
          if (pos >= 0) checked.splice(pos, 1)
          else checked.push(idx)
          return { checkedEntries: checked }
        }),

      checkAll: (indices) =>
        set((state) => {
          const checked = new Set(state.checkedEntries)
          indices.forEach((i) => checked.add(i))
          return { checkedEntries: [...checked] }
        }),

      uncheckAll: (indices) =>
        set((state) => {
          const checked = new Set(state.checkedEntries)
          indices.forEach((i) => checked.delete(i))
          return { checkedEntries: [...checked] }
        }),

      clearChecked: () => set({ checkedEntries: [] }),

      setSearchQuery: (q) => set({ searchQuery: q }),
      setDetailPanelWidth: (w) => set({ detailPanelWidth: w }),
      setDetailPanelOpen: (open) => set({ detailPanelOpen: open }),
      setActiveDetailTab: (tab) => set({ activeDetailTab: tab }),
      setScrollTop: (top) => set({ scrollTop: top }),
    }),
    {
      name: 'har-viewer-state',
      partialize: (state) => ({
        selectedIdx: state.selectedIdx,
        sortCol: state.sortCol,
        sortDir: state.sortDir,
        activeMethodFilters: state.activeMethodFilters,
        activeStatusFilters: state.activeStatusFilters,
        activeTypeFilters: state.activeTypeFilters,
        checkedEntries: state.checkedEntries,
        searchQuery: state.searchQuery,
        detailPanelWidth: state.detailPanelWidth,
        detailPanelOpen: state.detailPanelOpen,
        activeDetailTab: state.activeDetailTab,
        scrollTop: state.scrollTop,
        fileName: state.fileName,
      }),
    }
  )
)
