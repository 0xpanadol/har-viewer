import type { ParsedEntry } from '../../utils/types'
import { KvTable } from '../KvTable'
import { formatTime, formatBytes, statusClass } from '../../utils/formatters'

interface Props {
  entry: ParsedEntry
}

export function HeadersTab({ entry }: Props) {
  const raw = entry._raw

  const generalItems = [
    { name: 'Request URL', value: raw.request?.url || '' },
    { name: 'Method', value: raw.request?.method || '' },
    { name: 'Status', value: `${entry.status} ${entry.statusText}` },
    { name: 'HTTP Version', value: `${raw.request?.httpVersion || ''} → ${raw.response?.httpVersion || ''}` },
    { name: 'Started', value: raw.startedDateTime || '' },
    { name: 'Duration', value: formatTime(entry.time) },
    { name: 'Response Size', value: formatBytes(entry.size) },
    ...(raw.serverIPAddress ? [{ name: 'Server IP', value: raw.serverIPAddress }] : []),
    ...(raw.connection ? [{ name: 'Connection', value: raw.connection }] : []),
  ]

  const responseHeaders = raw.response?.headers || []
  const requestHeaders = raw.request?.headers || []
  const queryString = raw.request?.queryString || []

  return (
    <>
      <div className="section">
        <div className="section-title">General</div>
        <table className="kv-table">
          <tbody>
            {generalItems.map((item, i) => (
              <tr key={i}>
                <td className="kv-key">{item.name}</td>
                <td className="kv-val" style={item.name === 'Request URL' ? { wordBreak: 'break-all' } : undefined}>
                  {item.name === 'Status' ? (
                    <span className={statusClass(entry.status)}>{item.value}</span>
                  ) : (
                    item.value
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section">
        <div className="section-title">
          Response Headers <span className="badge">{responseHeaders.length}</span>
        </div>
        <KvTable items={responseHeaders} />
      </div>

      <div className="section">
        <div className="section-title">
          Request Headers <span className="badge">{requestHeaders.length}</span>
        </div>
        <KvTable items={requestHeaders} />
      </div>

      {queryString.length > 0 && (
        <div className="section">
          <div className="section-title">
            Query Parameters <span className="badge">{queryString.length}</span>
          </div>
          <KvTable items={queryString} decode />
        </div>
      )}
    </>
  )
}
