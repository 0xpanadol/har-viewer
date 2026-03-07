import type { ParsedEntry } from '../../utils/types'
import { KvTable } from '../KvTable'
import { Section } from '../Section'
import { formatTime, formatBytes, statusClass } from '../../utils/formatters'
import { highlightText } from '../../utils/highlight'

interface Props {
  entry: ParsedEntry
  searchQuery?: string
}

export function HeadersTab({ entry, searchQuery = '' }: Props) {
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

  const q = searchQuery.toLowerCase()
  const filterItems = (items: { name: string; value: string }[]) => {
    if (!q || q.length < 2) return items
    return items.filter((i) => i.name.toLowerCase().includes(q) || i.value.toLowerCase().includes(q))
  }

  const filteredGeneral = filterItems(generalItems)
  const filteredResHeaders = filterItems(responseHeaders)
  const filteredReqHeaders = filterItems(requestHeaders)
  const filteredQuery = filterItems(queryString)

  const matchCount = q.length >= 2 ? filteredGeneral.length + filteredResHeaders.length + filteredReqHeaders.length + filteredQuery.length : 0

  return (
    <>
      {q.length >= 2 && (
        <div className="tab-match-info">{matchCount} matching items</div>
      )}
      <Section title="General" defaultOpen>
        <table className="kv-table">
          <tbody>
            {filteredGeneral.map((item, i) => (
              <tr key={i}>
                <td className="kv-key">{highlightText(item.name, searchQuery)}</td>
                <td className="kv-val" style={item.name === 'Request URL' ? { wordBreak: 'break-all' } : undefined}>
                  {item.name === 'Status' ? (
                    <span className={statusClass(entry.status)}>{highlightText(item.value, searchQuery)}</span>
                  ) : (
                    highlightText(item.value, searchQuery)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Response Headers" badge={filteredResHeaders.length} defaultOpen>
        <KvTable items={filteredResHeaders} searchQuery={searchQuery} />
      </Section>

      <Section title="Request Headers" badge={filteredReqHeaders.length} defaultOpen>
        <KvTable items={filteredReqHeaders} searchQuery={searchQuery} />
      </Section>

      {filteredQuery.length > 0 && (
        <Section title="Query Parameters" badge={filteredQuery.length} defaultOpen>
          <KvTable items={filteredQuery} decode searchQuery={searchQuery} />
        </Section>
      )}
    </>
  )
}
