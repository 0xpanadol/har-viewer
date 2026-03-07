import { useState, useRef, useEffect, useCallback } from 'react'
import { useHarStore } from '../store/harStore'
import type { DetailTab } from '../utils/types'
import { HeadersTab } from './tabs/HeadersTab'
import { PayloadTab } from './tabs/PayloadTab'
import { ResponseTab } from './tabs/ResponseTab'
import { CookiesTab } from './tabs/CookiesTab'
import { TimingTab } from './tabs/TimingTab'
import { RawTab } from './tabs/RawTab'
import { WebSocketTab } from './tabs/WebSocketTab'

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'headers', label: 'Headers' },
  { id: 'payload', label: 'Payload' },
  { id: 'response', label: 'Response' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'timing', label: 'Timing' },
  { id: 'raw', label: 'Raw' },
]

export function DetailPanel() {
  const selectedIdx = useHarStore((s) => s.selectedIdx)
  const allEntries = useHarStore((s) => s.allEntries)
  const detailPanelOpen = useHarStore((s) => s.detailPanelOpen)
  const detailPanelWidth = useHarStore((s) => s.detailPanelWidth)
  const activeDetailTab = useHarStore((s) => s.activeDetailTab)
  const setDetailPanelOpen = useHarStore((s) => s.setDetailPanelOpen)
  const setActiveDetailTab = useHarStore((s) => s.setActiveDetailTab)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const entry = allEntries.find((e) => e._idx === selectedIdx)

  // Focus search on Ctrl+F when detail panel is open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && detailPanelOpen && entry) {
        e.preventDefault()
        e.stopPropagation()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
    }
    // Use capture phase to intercept before EntryList's handler
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [detailPanelOpen, entry])

  const clearSearch = useCallback(() => setSearchQuery(''), [])

  if (!detailPanelOpen || !entry) return null

  const hasWs = entry._raw._webSocketMessages && entry._raw._webSocketMessages.length > 0

  const renderTab = () => {
    switch (activeDetailTab) {
      case 'headers': return <HeadersTab entry={entry} searchQuery={searchQuery} />
      case 'payload': return <PayloadTab entry={entry} searchQuery={searchQuery} />
      case 'response': return <ResponseTab entry={entry} externalSearch={searchQuery} />
      case 'cookies': return <CookiesTab entry={entry} searchQuery={searchQuery} />
      case 'timing': return <TimingTab entry={entry} />
      case 'raw': return <RawTab entry={entry} />
    }
    return null
  }

  return (
    <div id="detail-panel" className="visible" style={{ width: detailPanelWidth }}>
      <div className="detail-header">
        <button className="detail-close" onClick={() => setDetailPanelOpen(false)}>✕</button>
        <div className="detail-title">{entry.method} {entry.path}</div>
      </div>
      <div className="detail-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`detail-tab ${activeDetailTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveDetailTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        {hasWs && (
          <button
            className={`detail-tab ${activeDetailTab === ('websocket' as string) ? 'active' : ''}`}
            onClick={() => setActiveDetailTab('websocket' as DetailTab)}
          >
            WS
          </button>
        )}
      </div>
      <div className="detail-search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="detail-search-icon">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={searchRef}
          id="detail-search-input"
          className="detail-search-input"
          type="text"
          placeholder="Search in headers, payload, response, cookies... (Ctrl+F)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="detail-search-clear" onClick={clearSearch} title="Clear search">✕</button>
        )}
      </div>
      <div className="detail-body">
        {activeDetailTab === ('websocket' as string) ? (
          <WebSocketTab entry={entry._raw} searchQuery={searchQuery} />
        ) : renderTab()}
      </div>
    </div>
  )
}
