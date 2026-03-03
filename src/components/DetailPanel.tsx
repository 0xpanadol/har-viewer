import { useHarStore } from '../store/harStore'
import type { DetailTab } from '../utils/types'
import { HeadersTab } from './tabs/HeadersTab'
import { PayloadTab } from './tabs/PayloadTab'
import { ResponseTab } from './tabs/ResponseTab'
import { CookiesTab } from './tabs/CookiesTab'
import { TimingTab } from './tabs/TimingTab'
import { RawTab } from './tabs/RawTab'

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

  const entry = allEntries.find((e) => e._idx === selectedIdx)

  if (!detailPanelOpen || !entry) return null

  const renderTab = () => {
    switch (activeDetailTab) {
      case 'headers': return <HeadersTab entry={entry} />
      case 'payload': return <PayloadTab entry={entry} />
      case 'response': return <ResponseTab entry={entry} />
      case 'cookies': return <CookiesTab entry={entry} />
      case 'timing': return <TimingTab entry={entry} />
      case 'raw': return <RawTab entry={entry} />
    }
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
      </div>
      <div className="detail-body">
        {renderTab()}
      </div>
    </div>
  )
}
