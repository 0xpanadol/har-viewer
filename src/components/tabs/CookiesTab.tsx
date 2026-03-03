import type { ParsedEntry } from '../../utils/types'
import { tryDecodeBase64, tryParseJson, prettyJson } from '../../utils/parsers'

interface Props {
  entry: ParsedEntry
}

export function CookiesTab({ entry }: Props) {
  const reqCookies = entry._raw.request?.cookies || []
  const resCookies = entry._raw.response?.cookies || []

  if (!reqCookies.length && !resCookies.length) {
    return <div style={{ color: 'var(--text-3)', padding: 20, textAlign: 'center' }}>No cookies</div>
  }

  return (
    <>
      {reqCookies.length > 0 && (
        <div className="section">
          <div className="section-title">
            Request Cookies <span className="badge">{reqCookies.length}</span>
          </div>
          <table className="kv-table">
            <tbody>
              {reqCookies.map((c, i) => {
                let decoded = ''
                if (/^[A-Za-z0-9+/=]{20,}$/.test(c.value)) {
                  const b = tryDecodeBase64(c.value)
                  if (b && /^[\x20-\x7E\r\n\t]+$/.test(b.slice(0, 100))) {
                    const j = tryParseJson(b)
                    decoded = `↳ base64: ${j ? prettyJson(j).slice(0, 500) : b.slice(0, 500)}`
                  }
                }
                if (!decoded) {
                  try {
                    const d = decodeURIComponent(c.value || '')
                    if (d !== c.value) decoded = `↳ ${d.slice(0, 500)}`
                  } catch { /* ignore */ }
                }
                return (
                  <tr key={i}>
                    <td className="kv-key" title={c.name}>{c.name}</td>
                    <td className="kv-val">
                      {c.value}
                      {decoded && <span className="decoded">{decoded}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {resCookies.length > 0 && (
        <div className="section">
          <div className="section-title">
            Response Cookies (Set-Cookie) <span className="badge">{resCookies.length}</span>
          </div>
          <table className="kv-table">
            <tbody>
              {resCookies.map((c, i) => {
                const meta: string[] = []
                if (c.path) meta.push(`Path: ${c.path}`)
                if (c.domain) meta.push(`Domain: ${c.domain}`)
                if (c.expires) meta.push(`Expires: ${c.expires}`)
                if (c.httpOnly) meta.push('HttpOnly')
                if (c.secure) meta.push('Secure')
                if (c.sameSite) meta.push(`SameSite: ${c.sameSite}`)
                return (
                  <tr key={i}>
                    <td className="kv-key" title={c.name}>{c.name}</td>
                    <td className="kv-val">
                      {c.value}
                      {meta.length > 0 && <span className="decoded">↳ {meta.join(' · ')}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
