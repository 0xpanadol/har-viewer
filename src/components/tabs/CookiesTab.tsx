import { useEffect, useRef } from 'react'
import type { ParsedEntry } from '../../utils/types'
import { tryDecodeBase64, tryParseJson, prettyJson } from '../../utils/parsers'
import { exportCookiesNetscape, exportCookiesJson, buildCookieHeader } from '../../utils/exporters'
import { Section } from '../Section'
import { highlightText } from '../../utils/highlight'
import { showToast } from '../Toast'

interface Props {
  entry: ParsedEntry
  searchQuery?: string
}

export function CookiesTab({ entry, searchQuery = '' }: Props) {
  const reqCookies = entry._raw.request?.cookies || []
  const resCookies = entry._raw.response?.cookies || []
  const hasCookies = reqCookies.length > 0 || resCookies.length > 0
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to first highlight
  useEffect(() => {
    if (searchQuery.length >= 2 && containerRef.current) {
      const timer = setTimeout(() => {
        const mark = containerRef.current?.querySelector('.search-hl')
        if (mark) mark.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [searchQuery])

  if (!hasCookies) {
    return <div style={{ color: 'var(--text-3)', padding: 20, textAlign: 'center' }}>No cookies</div>
  }

  const q = searchQuery.toLowerCase()
  const filterCookies = <T extends { name: string; value: string }>(cookies: T[]) => {
    if (!q || q.length < 2) return cookies
    return cookies.filter((c) => c.name.toLowerCase().includes(q) || c.value.toLowerCase().includes(q))
  }

  const filteredReq = filterCookies(reqCookies)
  const filteredRes = filterCookies(resCookies)

  return (
    <div ref={containerRef}>
      <div className="cookie-actions">
        <button className="tool-btn" onClick={() => { navigator.clipboard.writeText(buildCookieHeader([entry._raw])); showToast('Copied cookie header') }} title="Copy as Cookie header">
          Copy header
        </button>
        <button className="tool-btn" onClick={() => exportCookiesNetscape([entry._raw], `req-${entry._idx + 1}`)} title="Export Netscape cookies.txt">
          Export .txt
        </button>
        <button className="tool-btn" onClick={() => exportCookiesJson([entry._raw], `req-${entry._idx + 1}`)} title="Export cookies JSON">
          Export JSON
        </button>
      </div>

      {q.length >= 2 && (
        <div className="tab-match-info">{filteredReq.length + filteredRes.length} matching cookies</div>
      )}

      {filteredReq.length > 0 && (
        <Section title="Request Cookies" badge={filteredReq.length} defaultOpen>
          <table className="kv-table">
            <tbody>
              {filteredReq.map((c, i) => {
                let decoded = ''
                if (/^[A-Za-z0-9+/=]{20,}$/.test(c.value)) {
                  const b = tryDecodeBase64(c.value)
                  if (b && /^[\x20-\x7E\r\n\t]+$/.test(b.slice(0, 100))) {
                    const j = tryParseJson(b)
                    decoded = `↳ base64: ${j ? JSON.stringify(j) : b}`
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
                    <td className="kv-key" title={c.name}>{highlightText(c.name, searchQuery)}</td>
                    <td className="kv-val">
                      {highlightText(c.value, searchQuery)}
                      {decoded && <span className="decoded">{highlightText(decoded, searchQuery)}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Section>
      )}

      {filteredRes.length > 0 && (
        <Section title="Response Cookies (Set-Cookie)" badge={filteredRes.length} defaultOpen>
          <table className="kv-table">
            <tbody>
              {filteredRes.map((c, i) => {
                const meta: string[] = []
                if (c.path) meta.push(`Path: ${c.path}`)
                if (c.domain) meta.push(`Domain: ${c.domain}`)
                if (c.expires) meta.push(`Expires: ${c.expires}`)
                if (c.httpOnly) meta.push('HttpOnly')
                if (c.secure) meta.push('Secure')
                if (c.sameSite) meta.push(`SameSite: ${c.sameSite}`)
                return (
                  <tr key={i}>
                    <td className="kv-key" title={c.name}>{highlightText(c.name, searchQuery)}</td>
                    <td className="kv-val">
                      {highlightText(c.value, searchQuery)}
                      {meta.length > 0 && <span className="decoded">↳ {meta.join(' · ')}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Section>
      )}
    </div>
  )
}
