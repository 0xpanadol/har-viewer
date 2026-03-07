import { tryDecodeBase64, tryParseJson, prettyJson } from '../utils/parsers'
import { highlightText } from '../utils/highlight'

interface KvItem {
  name?: string
  key?: string
  value?: string
}

interface Props {
  items: KvItem[]
  decode?: boolean
  searchQuery?: string
}

export function KvTable({ items, decode, searchQuery = '' }: Props) {
  if (!items || !items.length) {
    return <div style={{ color: 'var(--text-3)', fontSize: 12, padding: 8 }}>No data</div>
  }

  return (
    <table className="kv-table">
      <tbody>
        {items.map((item, i) => {
          const key = item.name || item.key || ''
          const val = item.value || ''
          let decoded = ''

          if (decode) {
            try {
              const d = decodeURIComponent(val)
              if (d !== val) decoded = `↳ ${d}`
            } catch { /* ignore */ }

            if (!decoded && /^[A-Za-z0-9+/=]{20,}$/.test(val)) {
              const b = tryDecodeBase64(val)
              if (b && /^[\x20-\x7E\r\n\t]+$/.test(b.slice(0, 100))) {
                const j = tryParseJson(b)
                decoded = `↳ base64: ${j ? JSON.stringify(j) : b}`
              }
            }
          }

          return (
            <tr key={`${key}-${i}`}>
              <td className="kv-key" title={key}>{highlightText(key, searchQuery)}</td>
              <td className="kv-val">
                {highlightText(val, searchQuery)}
                {decoded && <span className="decoded">{highlightText(decoded, searchQuery)}</span>}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
