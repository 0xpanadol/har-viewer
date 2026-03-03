import { useHarStore } from '../store/harStore'
import { exportHarEntries, exportCookiesNetscape, exportCookiesJson } from '../utils/exporters'

export function SelectionBar() {
  const checkedEntries = useHarStore((s) => s.checkedEntries)
  const allEntries = useHarStore((s) => s.allEntries)
  const harData = useHarStore((s) => s.harData)
  const clearChecked = useHarStore((s) => s.clearChecked)
  const setDiffEntries = useHarStore((s) => s.setDiffEntries)
  const setOverlayPanel = useHarStore((s) => s.setOverlayPanel)

  if (checkedEntries.length === 0) return null

  const checkedRaw = allEntries.filter((e) => checkedEntries.includes(e._idx)).map((e) => e._raw)
  const checkedUrls = allEntries.filter((e) => checkedEntries.includes(e._idx)).map((e) => e.url)

  const handleExportHar = () => exportHarEntries(checkedRaw, 'selected', harData)
  const handleCopyUrls = () => navigator.clipboard.writeText(checkedUrls.join('\n'))
  const handleExportCookiesTxt = () => exportCookiesNetscape(checkedRaw, 'selected')
  const handleExportCookiesJson = () => exportCookiesJson(checkedRaw, 'selected')
  const handleDiff = () => {
    if (checkedEntries.length === 2) {
      setDiffEntries([checkedEntries[0], checkedEntries[1]])
      setOverlayPanel('diff')
    }
  }

  return (
    <div id="selection-bar" className="visible">
      <div className="sel-info">
        <span className="sel-count">{checkedEntries.length}</span> selected
      </div>
      <div className="sel-actions">
        <button onClick={handleExportHar} title="Export selected as HAR">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="sel-btn-label">HAR</span>
        </button>
        <button onClick={handleCopyUrls} title="Copy URLs to clipboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          <span className="sel-btn-label">URLs</span>
        </button>
        <button onClick={handleExportCookiesTxt} title="Export cookies as Netscape cookies.txt">
          🍪 <span className="sel-btn-label">.txt</span>
        </button>
        <button onClick={handleExportCookiesJson} title="Export cookies as JSON">
          🍪 <span className="sel-btn-label">JSON</span>
        </button>
        {checkedEntries.length === 2 && (
          <button onClick={handleDiff} title="Diff selected requests">
            ⇄ <span className="sel-btn-label">Diff</span>
          </button>
        )}
      </div>
      <div className="sel-right">
        <button onClick={clearChecked} title="Clear selection">✕</button>
      </div>
    </div>
  )
}
