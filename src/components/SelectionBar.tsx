import { useState } from 'react'
import { useHarStore } from '../store/harStore'
import { useFilteredEntries } from '../hooks/useFilteredEntries'
import { exportHarEntries, exportCookiesNetscape, exportCookiesJson, exportCsv, exportSanitizedHar } from '../utils/exporters'
import { ConfirmDialog } from './ConfirmDialog'

export function SelectionBar() {
  const checkedEntries = useHarStore((s) => s.checkedEntries)
  const allEntries = useHarStore((s) => s.allEntries)
  const harData = useHarStore((s) => s.harData)
  const clearChecked = useHarStore((s) => s.clearChecked)
  const setDiffEntries = useHarStore((s) => s.setDiffEntries)
  const setOverlayPanel = useHarStore((s) => s.setOverlayPanel)
  const pinnedEntries = useHarStore((s) => s.pinnedEntries)
  const deleteEntries = useHarStore((s) => s.deleteEntries)
  const filteredEntries = useFilteredEntries()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (checkedEntries.length === 0 && !confirmDelete) return null

  const checked = allEntries.filter((e) => checkedEntries.includes(e._idx))
  const checkedRaw = checked.map((e) => e._raw)
  const checkedUrls = checked.map((e) => e.url)
  const hasPinned = checkedEntries.some((i) => pinnedEntries.includes(i))

  const handleExportHar = () => exportHarEntries(checkedRaw, 'selected', harData)
  const handleExportCsv = () => exportCsv(checked, 'selected')
  const handleExportSanitized = () => exportSanitizedHar(checkedRaw, 'selected', harData)
  const handleCopyUrls = () => navigator.clipboard.writeText(checkedUrls.join('\n'))
  const handleExportCookiesTxt = () => exportCookiesNetscape(checkedRaw, 'selected')
  const handleExportCookiesJson = () => exportCookiesJson(checkedRaw, 'selected')
  const handleDiff = () => {
    if (checkedEntries.length === 2) {
      setDiffEntries([checkedEntries[0], checkedEntries[1]])
      setOverlayPanel('diff')
    }
  }

  const handleDelete = () => {
    if (hasPinned) setConfirmDelete(true)
    else doDelete()
  }

  const doDelete = () => {
    const fi = filteredEntries.map((e) => e._idx)
    deleteEntries([...checkedEntries], fi)
    setConfirmDelete(false)
  }

  if (checkedEntries.length === 0) return confirmDelete ? (
    <ConfirmDialog title="Delete pinned entries?" message="Selection includes pinned requests. Delete anyway?" confirmLabel="Delete" variant="danger" onConfirm={doDelete} onCancel={() => setConfirmDelete(false)} />
  ) : null

  return (
    <>
      <div id="selection-bar" className="visible">
        <div className="sel-info">
          <span className="sel-count">{checkedEntries.length}</span> selected
        </div>
        <div className="sel-actions">
          <button onClick={handleExportHar} title="Export selected as HAR">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            <span className="sel-btn-label">HAR</span>
          </button>
          <button onClick={handleExportCsv} title="Export selected as CSV">
            <span style={{ fontSize: 10, fontWeight: 700 }}>CSV</span>
          </button>
          <button onClick={handleExportSanitized} title="Export sanitized (redacted) HAR">
            🔒 <span className="sel-btn-label">Safe</span>
          </button>
          <button onClick={handleCopyUrls} title="Copy URLs to clipboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
            <span className="sel-btn-label">URLs</span>
          </button>
          <button onClick={handleExportCookiesTxt} title="Export cookies as Netscape cookies.txt">🍪 <span className="sel-btn-label">.txt</span></button>
          <button onClick={handleExportCookiesJson} title="Export cookies as JSON">🍪 <span className="sel-btn-label">JSON</span></button>
          {checkedEntries.length === 2 && (
            <button onClick={handleDiff} title="Diff selected requests">⇄ <span className="sel-btn-label">Diff</span></button>
          )}
          <button onClick={handleDelete} title="Delete selected requests" className="sel-delete-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
            <span className="sel-btn-label">Delete</span>
          </button>
        </div>
        <div className="sel-right">
          <button onClick={clearChecked} title="Clear selection">✕</button>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmDialog title="Delete pinned entries?" message={`${checkedEntries.length} selected entries include pinned requests. Delete anyway?`} confirmLabel="Delete" variant="danger" onConfirm={doDelete} onCancel={() => setConfirmDelete(false)} />
      )}
    </>
  )
}
