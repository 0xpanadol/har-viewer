import { useRef, useEffect, useState } from 'react'
import { useHarStore } from './store/harStore'
import { useFileLoader } from './hooks/useFileLoader'
import { loadHarData as loadFromIDB } from './utils/storage'
import { DropZone } from './components/DropZone'
import { LoadingOverlay } from './components/LoadingOverlay'
import { Welcome } from './components/Welcome'
import { Toolbar } from './components/Toolbar'
import { SelectionBar } from './components/SelectionBar'
import { EntryList } from './components/EntryList'
import { ResizeHandle } from './components/ResizeHandle'
import { DetailPanel } from './components/DetailPanel'
import { SummaryBar } from './components/SummaryBar'

export default function App() {
  const allEntries = useHarStore((s) => s.allEntries)
  const fileName = useHarStore((s) => s.fileName)
  const restoreHarData = useHarStore((s) => s.restoreHarData)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { loading, progress, loadText, loadFile } = useFileLoader()
  const [restoring, setRestoring] = useState(true)

  // Restore HAR data from IndexedDB on mount
  useEffect(() => {
    loadFromIDB().then((data) => {
      if (data) {
        restoreHarData(data as Parameters<typeof restoreHarData>[0])
      }
      setRestoring(false)
    }).catch(() => setRestoring(false))
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
          <Toolbar onOpenFile={handleOpenFile} />
          <SelectionBar />
          <div id="main" className="visible">
            <EntryList />
            <ResizeHandle />
            <DetailPanel />
          </div>
          <SummaryBar />
        </>
      )}
    </div>
  )
}
