import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HarLog, ParsedEntry, SortColumn, SortDirection, DetailTab, VisibleColumns, OverlayPanel, Theme, FilterPreset, ValidationWarning, Annotation } from '../utils/types'
import { DEFAULT_VISIBLE_COLUMNS } from '../utils/types'
import { parseHarEntries, validateHar } from '../utils/parsers'
import { saveHarData as saveToIDB, clearHarData as clearFromIDB } from '../utils/storage'

interface HarState {
  // Data (not persisted — reloaded from file)
  harData: HarLog | null
  allEntries: ParsedEntry[]
  fileName: string
  validationWarnings: ValidationWarning[]

  // UI state (persisted)
  theme: Theme
  selectedIdx: number
  sortCol: SortColumn
  sortDir: SortDirection
  activeMethodFilters: string[]
  activeStatusFilters: string[]
  activeTypeFilters: string[]
  activeDomainFilters: string[]
  checkedEntries: number[]
  pinnedEntries: number[]
  searchQuery: string
  useRegex: boolean
  negateSearch: boolean
  detailPanelWidth: number
  detailPanelOpen: boolean
  activeDetailTab: DetailTab
  scrollTop: number
  visibleColumns: VisibleColumns
  overlayPanel: OverlayPanel
  diffEntries: [number, number] | null
  // Range filters
  minTime: number | null
  maxTime: number | null
  minSize: number | null
  maxSize: number | null
  // Filter presets
  filterPresets: FilterPreset[]
  // Annotations
  annotations: Annotation[]
  // Compare data
  compareData: { log: HarLog; fileName: string } | null

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
  toggleDomainFilter: (domain: string) => void
  toggleCheck: (idx: number) => void
  checkAll: (indices: number[]) => void
  uncheckAll: (indices: number[]) => void
  clearChecked: () => void
  togglePin: (idx: number) => void
  clearPins: () => void
  setSearchQuery: (q: string) => void
  setUseRegex: (v: boolean) => void
  setNegateSearch: (v: boolean) => void
  setDetailPanelWidth: (w: number) => void
  setDetailPanelOpen: (open: boolean) => void
  setActiveDetailTab: (tab: DetailTab) => void
  setScrollTop: (top: number) => void
  setVisibleColumns: (cols: VisibleColumns) => void
  toggleColumn: (col: keyof VisibleColumns) => void
  setOverlayPanel: (panel: OverlayPanel) => void
  setDiffEntries: (entries: [number, number] | null) => void
  resetFilters: () => void
  setTheme: (theme: Theme) => void
  setMinTime: (v: number | null) => void
  setMaxTime: (v: number | null) => void
  setMinSize: (v: number | null) => void
  setMaxSize: (v: number | null) => void
  saveFilterPreset: (name: string) => void
  deleteFilterPreset: (id: string) => void
  applyFilterPreset: (preset: FilterPreset) => void
  addAnnotation: (entryIdx: number, text: string) => void
  removeAnnotation: (entryIdx: number) => void
  setCompareData: (data: { log: HarLog; fileName: string } | null) => void
}

export const useHarStore = create<HarState>()(
  persist(
    (set, get) => ({
      harData: null,
      allEntries: [],
      fileName: '',
      validationWarnings: [],
      theme: 'dark',
      selectedIdx: -1,
      sortCol: 'none',
      sortDir: 'asc',
      activeMethodFilters: [],
      activeStatusFilters: [],
      activeTypeFilters: [],
      activeDomainFilters: [],
      checkedEntries: [],
      pinnedEntries: [],
      searchQuery: '',
      useRegex: false,
      negateSearch: false,
      detailPanelWidth: 420,
      detailPanelOpen: false,
      activeDetailTab: 'headers',
      scrollTop: 0,
      visibleColumns: { ...DEFAULT_VISIBLE_COLUMNS },
      overlayPanel: 'none',
      diffEntries: null,
      minTime: null,
      maxTime: null,
      minSize: null,
      maxSize: null,
      filterPresets: [],
      annotations: [],
      compareData: null,
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
        const warnings = validateHar(log)
        set({
          harData: log,
          allEntries: entries,
          fileName,
          waterfallStart: wfStart,
          waterfallEnd: wfEnd,
          validationWarnings: warnings,
        })
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
        const warnings = validateHar(log)
        set({
          harData: log,
          allEntries: entries,
          waterfallStart: wfStart,
          waterfallEnd: wfEnd,
          validationWarnings: warnings,
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
          activeDomainFilters: [],
          checkedEntries: [],
          pinnedEntries: [],
          searchQuery: '',
          useRegex: false,
          negateSearch: false,
          detailPanelOpen: false,
          scrollTop: 0,
          overlayPanel: 'none',
          diffEntries: null,
          waterfallStart: 0,
          waterfallEnd: 0,
          minTime: null,
          maxTime: null,
          minSize: null,
          maxSize: null,
          validationWarnings: [],
          compareData: null,
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

      toggleDomainFilter: (domain) =>
        set((state) => {
          const filters = [...state.activeDomainFilters]
          const idx = filters.indexOf(domain)
          if (idx >= 0) filters.splice(idx, 1)
          else filters.push(domain)
          return { activeDomainFilters: filters }
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

      togglePin: (idx) =>
        set((state) => {
          const pins = [...state.pinnedEntries]
          const pos = pins.indexOf(idx)
          if (pos >= 0) pins.splice(pos, 1)
          else pins.push(idx)
          return { pinnedEntries: pins }
        }),

      clearPins: () => set({ pinnedEntries: [] }),

      setSearchQuery: (q) => set({ searchQuery: q }),
      setUseRegex: (v) => set({ useRegex: v }),
      setNegateSearch: (v) => set({ negateSearch: v }),
      setDetailPanelWidth: (w) => set({ detailPanelWidth: w }),
      setDetailPanelOpen: (open) => set({ detailPanelOpen: open }),
      setActiveDetailTab: (tab) => set({ activeDetailTab: tab }),
      setScrollTop: (top) => set({ scrollTop: top }),
      setVisibleColumns: (cols) => set({ visibleColumns: cols }),
      toggleColumn: (col) =>
        set((state) => ({
          visibleColumns: { ...state.visibleColumns, [col]: !state.visibleColumns[col] },
        })),
      setOverlayPanel: (panel) => set({ overlayPanel: panel }),
      setDiffEntries: (entries) => set({ diffEntries: entries }),

      resetFilters: () =>
        set({
          selectedIdx: -1,
          sortCol: 'none',
          sortDir: 'asc',
          activeMethodFilters: [],
          activeStatusFilters: [],
          activeTypeFilters: [],
          activeDomainFilters: [],
          checkedEntries: [],
          pinnedEntries: [],
          searchQuery: '',
          useRegex: false,
          negateSearch: false,
          detailPanelOpen: false,
          overlayPanel: 'none',
          diffEntries: null,
          scrollTop: 0,
          visibleColumns: { ...DEFAULT_VISIBLE_COLUMNS },
          minTime: null,
          maxTime: null,
          minSize: null,
          maxSize: null,
        }),

      setTheme: (theme) => set({ theme }),
      setMinTime: (v) => set({ minTime: v }),
      setMaxTime: (v) => set({ maxTime: v }),
      setMinSize: (v) => set({ minSize: v }),
      setMaxSize: (v) => set({ maxSize: v }),

      saveFilterPreset: (name) =>
        set((state) => {
          const preset: FilterPreset = {
            id: Date.now().toString(36),
            name,
            searchQuery: state.searchQuery,
            useRegex: state.useRegex,
            negateSearch: state.negateSearch,
            activeMethodFilters: [...state.activeMethodFilters],
            activeStatusFilters: [...state.activeStatusFilters],
            activeTypeFilters: [...state.activeTypeFilters],
            activeDomainFilters: [...state.activeDomainFilters],
            minTime: state.minTime,
            maxTime: state.maxTime,
            minSize: state.minSize,
            maxSize: state.maxSize,
          }
          return { filterPresets: [...state.filterPresets, preset] }
        }),

      deleteFilterPreset: (id) =>
        set((state) => ({
          filterPresets: state.filterPresets.filter((p) => p.id !== id),
        })),

      applyFilterPreset: (preset) =>
        set({
          searchQuery: preset.searchQuery,
          useRegex: preset.useRegex,
          negateSearch: preset.negateSearch,
          activeMethodFilters: [...preset.activeMethodFilters],
          activeStatusFilters: [...preset.activeStatusFilters],
          activeTypeFilters: [...preset.activeTypeFilters],
          activeDomainFilters: [...preset.activeDomainFilters],
          minTime: preset.minTime,
          maxTime: preset.maxTime,
          minSize: preset.minSize,
          maxSize: preset.maxSize,
        }),

      addAnnotation: (entryIdx, text) =>
        set((state) => {
          const filtered = state.annotations.filter((a) => a.entryIdx !== entryIdx)
          return { annotations: [...filtered, { entryIdx, text, createdAt: Date.now() }] }
        }),

      removeAnnotation: (entryIdx) =>
        set((state) => ({
          annotations: state.annotations.filter((a) => a.entryIdx !== entryIdx),
        })),

      setCompareData: (data) => set({ compareData: data }),
    }),
    {
      name: 'har-viewer-state',
      partialize: (state) => ({
        theme: state.theme,
        selectedIdx: state.selectedIdx,
        sortCol: state.sortCol,
        sortDir: state.sortDir,
        activeMethodFilters: state.activeMethodFilters,
        activeStatusFilters: state.activeStatusFilters,
        activeTypeFilters: state.activeTypeFilters,
        activeDomainFilters: state.activeDomainFilters,
        checkedEntries: state.checkedEntries,
        pinnedEntries: state.pinnedEntries,
        searchQuery: state.searchQuery,
        useRegex: state.useRegex,
        negateSearch: state.negateSearch,
        detailPanelWidth: state.detailPanelWidth,
        detailPanelOpen: state.detailPanelOpen,
        activeDetailTab: state.activeDetailTab,
        scrollTop: state.scrollTop,
        visibleColumns: state.visibleColumns,
        fileName: state.fileName,
        minTime: state.minTime,
        maxTime: state.maxTime,
        minSize: state.minSize,
        maxSize: state.maxSize,
        filterPresets: state.filterPresets,
        annotations: state.annotations,
      }),
    }
  )
)
