import { useRef, useEffect, useState } from 'react'
import { useHarStore } from './store/harStore'
import { useFileLoader } from './hooks/useFileLoader'
import { loadHarData as loadFromIDB } from './utils/storage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { DropZone } from './components/DropZone'
import { LoadingOverlay } from './components/LoadingOverlay'
import { Welcome } from './components/Welcome'
import { Toolbar } from './components/Toolbar'
import { SelectionBar } from './components/SelectionBar'
import { EntryList } from './components/EntryList'
import { ResizeHandle } from './components/ResizeHandle'
import { DetailPanel } from './components/DetailPanel'
import { SummaryBar } from './components/SummaryBar'
import { WaterfallMinimap } from './components/WaterfallMinimap'
import { StatsPanel } from './components/StatsPanel'
import { IssuesPanel } from './components/IssuesPanel'
import { DiffPanel } from './components/DiffPanel'
import { PerformancePanel } from './components/PerformancePanel'
import { GroupingPanel } from './components/GroupingPanel'
import { TimelinePanel } from './components/TimelinePanel'
import { ComparePanel } from './components/ComparePanel'
import { InitiatorPanel } from './components/InitiatorPanel'
import { ShortcutsPanel } from './components/ShortcutsPanel'

export default function App() {
  const allEntries = useHarStore((s) => s.allEntries)
  const fileName = useHarStore((s) => s.fileName)
  const restoreHarData = useHarStore((s) => s.restoreHarData)
  const overlayPanel = useHarStore((s) => s.overlayPanel)
  const theme = useHarStore((s) => s.theme)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { loading, progress, loadText, loadFile } = useFileLoader()
  const [restoring, setRestoring] = useState(true)

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Ctrl+S to save state, Ctrl+Z to undo, ? for shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        useHarStore.getState().saveState()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
        e.preventDefault()
        useHarStore.getState().undoDelete()
      }
      if (e.key === '?' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        const store = useHarStore.getState()
        if (store.allEntries.length > 0) {
          store.setOverlayPanel(store.overlayPanel === 'shortcuts' ? 'none' : 'shortcuts')
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Restore HAR data from IndexedDB on mount
  useEffect(() => {
    loadFromIDB().then((data) => {
      if (data) {
        restoreHarData(data as Parameters<typeof restoreHarData>[0])
      }
      setRestoring(false)
    }).catch(() => setRestoring(false))
  }, [])

  // Restore filter state from URL hash on mount
  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1)
      if (!hash) return
      const params = JSON.parse(decodeURIComponent(hash))
      const store = useHarStore.getState()
      if (params.q) store.setSearchQuery(params.q)
      if (params.m) params.m.forEach((m: string) => {
        if (!store.activeMethodFilters.includes(m)) store.toggleMethodFilter(m)
      })
      if (params.s) params.s.forEach((s: string) => {
        if (!store.activeStatusFilters.includes(s)) store.toggleStatusFilter(s)
      })
      if (params.t) params.t.forEach((t: string) => {
        if (!store.activeTypeFilters.includes(t)) store.toggleTypeFilter(t)
      })
      if (params.d) params.d.forEach((d: string) => {
        if (!store.activeDomainFilters.includes(d)) store.toggleDomainFilter(d)
      })
      if (params.rx) store.setUseRegex(true)
      if (params.neg) store.setNegateSearch(true)
    } catch { /* invalid hash, ignore */ }
  }, [])

  const hasData = allEntries.length > 0

  const handleOpenFile = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
    if (fileName) document.title = `HAR Viewer — ${fileName}`
    else document.title = 'HAR Viewer'
  }, [fileName])

  // Share via URL: update hash when filters change
  const searchQuery = useHarStore((s) => s.searchQuery)
  const activeMethodFilters = useHarStore((s) => s.activeMethodFilters)
  const activeStatusFilters = useHarStore((s) => s.activeStatusFilters)
  const activeTypeFilters = useHarStore((s) => s.activeTypeFilters)
  const activeDomainFilters = useHarStore((s) => s.activeDomainFilters)
  const useRegex = useHarStore((s) => s.useRegex)
  const negateSearch = useHarStore((s) => s.negateSearch)

  useEffect(() => {
    if (!hasData) return
    const params: Record<string, unknown> = {}
    if (searchQuery) params.q = searchQuery
    if (activeMethodFilters.length) params.m = activeMethodFilters
    if (activeStatusFilters.length) params.s = activeStatusFilters
    if (activeTypeFilters.length) params.t = activeTypeFilters
    if (activeDomainFilters.length) params.d = activeDomainFilters
    if (useRegex) params.rx = true
    if (negateSearch) params.neg = true
    if (Object.keys(params).length > 0) {
      window.history.replaceState(null, '', '#' + encodeURIComponent(JSON.stringify(params)))
    } else {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [hasData, searchQuery, activeMethodFilters, activeStatusFilters, activeTypeFilters, activeDomainFilters, useRegex, negateSearch])

  return (
    <div id="app">
      <DropZone onFileDrop={loadFile} />
      <LoadingOverlay visible={loading} text={loadText} progress={progress} />
      <input
        type="file"
        ref={fileInputRef}
        accept=".har,.json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {!hasData && !loading && !restoring && <Welcome onOpenFile={handleOpenFile} />}

      {restoring && !hasData && (
        <LoadingOverlay visible={true} text="Restoring session..." progress={50} />
      )}

      {hasData && (
        <>
          <ErrorBoundary label="Toolbar">
            <Toolbar onOpenFile={handleOpenFile} />
          </ErrorBoundary>
          <ErrorBoundary label="SelectionBar">
            <SelectionBar />
          </ErrorBoundary>
          <WaterfallMinimap />
          <div id="main" className="visible">
            <ErrorBoundary label="EntryList">
              <EntryList />
            </ErrorBoundary>
            <ResizeHandle />
            <ErrorBoundary label="DetailPanel">
              <DetailPanel />
            </ErrorBoundary>
            <ErrorBoundary label="Overlay">
              <>
                {overlayPanel === 'stats' && <StatsPanel />}
                {overlayPanel === 'issues' && <IssuesPanel />}
                {overlayPanel === 'diff' && <DiffPanel />}
                {overlayPanel === 'perf' && <PerformancePanel />}
                {overlayPanel === 'grouping' && <GroupingPanel />}
                {overlayPanel === 'timeline' && <TimelinePanel />}
                {overlayPanel === 'compare' && <ComparePanel />}
                {overlayPanel === 'initiator' && <InitiatorPanel />}
                {(overlayPanel) === 'shortcuts' && <ShortcutsPanel />}
              </>
            </ErrorBoundary>
          </div>
          <SummaryBar />
        </>
      )}
    </div>
  )
}
