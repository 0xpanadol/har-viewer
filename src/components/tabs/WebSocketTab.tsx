import type { HarEntry } from '../../utils/types'
import { formatTime } from '../../utils/formatters'

interface Props {
  entry: HarEntry
  searchQuery?: string
}

export function WebSocketTab({ entry, searchQuery }: Props) {
  const messages = entry._webSocketMessages || []

  if (messages.length === 0) {
    return <div className="tab-empty">No WebSocket messages for this request</div>
  }

  const filtered = searchQuery
    ? messages.filter((m) => m.data.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages

  return (
    <div className="ws-tab" role="table" aria-label="WebSocket messages">
      <div className="ws-header" role="row">
        <div role="columnheader">Dir</div>
        <div role="columnheader">Time</div>
        <div role="columnheader">Length</div>
        <div role="columnheader">Data</div>
      </div>
      {filtered.map((msg, i) => {
        let preview = msg.data
        let isJson = false
        try {
          JSON.parse(msg.data)
          isJson = true
        } catch { /* not json */ }

        return (
          <div key={i} className={`ws-row ws-${msg.type}`} role="row">
            <div className={`ws-dir ws-dir-${msg.type}`} role="cell">
              {msg.type === 'send' ? '↑' : '↓'}
            </div>
            <div className="ws-time" role="cell">{formatTime(msg.time)}</div>
            <div className="ws-len" role="cell">{msg.data.length}</div>
            <div className="ws-data" role="cell" title={preview}>
              {isJson && <span className="ws-json-badge">JSON</span>}
              {preview.length > 200 ? preview.slice(0, 200) + '…' : preview}
            </div>
          </div>
        )
      })}
      <div className="ws-summary">{filtered.length} message{filtered.length !== 1 ? 's' : ''} ({messages.filter((m) => m.type === 'send').length} sent, {messages.filter((m) => m.type === 'receive').length} received)</div>
    </div>
  )
}
