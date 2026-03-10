import { useEffect, useRef } from 'react'
import type { ParsedEntry } from '../../utils/types'
import { KvTable } from '../KvTable'
import { CodeBlock } from '../CodeBlock'
import { Section } from '../Section'
import { tryParseJson, prettyJson } from '../../utils/parsers'
import { highlightText } from '../../utils/highlight'

interface Props {
  entry: ParsedEntry
  searchQuery?: string
}

export function PayloadTab({ entry, searchQuery = '' }: Props) {
  const pd = entry._raw.request?.postData
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

  if (!pd) {
    return <div style={{ color: 'var(--text-3)', padding: 20, textAlign: 'center' }}>No request payload</div>
  }

  const q = searchQuery.toLowerCase()
  const bodyText = pd.text || ''
  const hasBodyMatch = q.length >= 2 && bodyText.toLowerCase().includes(q)
  const filteredParams = q.length >= 2 && pd.params
    ? pd.params.filter((p) => p.name.toLowerCase().includes(q) || (p.value || '').toLowerCase().includes(q))
    : pd.params

  return (
    <div ref={containerRef}>
      <Section title="Content Type" defaultOpen>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-1)', padding: '4px 0' }}>
          {highlightText(pd.mimeType || '', searchQuery)}
        </div>
      </Section>

      {filteredParams && filteredParams.length > 0 && (
        <Section title="Form Parameters" badge={filteredParams.length} defaultOpen>
          <KvTable items={filteredParams} decode searchQuery={searchQuery} />
        </Section>
      )}

      {bodyText && renderBody(bodyText, pd.mimeType || '', searchQuery)}
    </div>
  )
}

function renderBody(bodyText: string, mimeType: string, searchQuery: string) {
  const mime = mimeType.toLowerCase()

  // GraphQL detection
  if (mime.includes('json')) {
    const parsed = tryParseJson(bodyText)
    if (parsed && typeof parsed === 'object' && parsed !== null && 'query' in parsed) {
      const gql = parsed as { query?: string; variables?: unknown; operationName?: string }
      return (
        <>
          {gql.operationName && (
            <Section title="Operation" defaultOpen>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', padding: '4px 0' }}>
                {highlightText(gql.operationName, searchQuery)}
              </div>
            </Section>
          )}
          <Section title="GraphQL Query" defaultOpen>
            <CodeBlock content={gql.query || ''} searchQuery={searchQuery} />
          </Section>
          {gql.variables && Object.keys(gql.variables as object).length > 0 && (
            <Section title="Variables" defaultOpen>
              <CodeBlock content={prettyJson(gql.variables)} searchQuery={searchQuery} />
            </Section>
          )}
          <Section title="Raw Body">
            <CodeBlock content={prettyJson(parsed)} searchQuery={searchQuery} />
          </Section>
        </>
      )
    }
  }

  // JSON
  if (mime.includes('json') || tryParseJson(bodyText)) {
    const parsed = tryParseJson(bodyText)
    if (parsed) {
      return (
        <Section title="JSON Body" defaultOpen>
          <CodeBlock content={prettyJson(parsed)} searchQuery={searchQuery} />
        </Section>
      )
    }
  }

  // Multipart form data
  if (mime.includes('multipart')) {
    const boundaryMatch = mimeType.match(/boundary=([^\s;]+)/)
    if (boundaryMatch) {
      const boundary = boundaryMatch[1]
      const parts = bodyText.split('--' + boundary).filter((p) => p.trim() && p.trim() !== '--')
      return (
        <Section title={`Multipart Form Data (${parts.length} parts)`} defaultOpen>
          {parts.map((part, i) => {
            const [headerBlock, ...bodyParts] = part.split('\r\n\r\n')
            const body = bodyParts.join('\r\n\r\n').trim()
            const nameMatch = headerBlock.match(/name="([^"]*)"/)
            const fileMatch = headerBlock.match(/filename="([^"]*)"/)
            const ctMatch = headerBlock.match(/Content-Type:\s*(.+)/i)
            return (
              <div key={i} style={{ marginBottom: 8, padding: '6px 8px', background: 'var(--bg-1)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 8, fontSize: 11, marginBottom: 4 }}>
                  {nameMatch && <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{highlightText(nameMatch[1], searchQuery)}</span>}
                  {fileMatch && <span style={{ color: 'var(--orange)', fontFamily: 'var(--mono)' }}>📎 {highlightText(fileMatch[1], searchQuery)}</span>}
                  {ctMatch && <span style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{ctMatch[1].trim()}</span>}
                </div>
                {body && body.length < 5000 && (
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 120, overflow: 'auto' }}>
                    {highlightText(body.slice(0, 2000), searchQuery)}
                    {body.length > 2000 && <span style={{ color: 'var(--text-3)' }}> …({body.length} bytes)</span>}
                  </div>
                )}
                {body && body.length >= 5000 && (
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Binary data ({body.length} bytes)</div>
                )}
              </div>
            )
          })}
        </Section>
      )
    }
  }

  // URL-encoded form data
  if (mime.includes('x-www-form-urlencoded') && bodyText.includes('=')) {
    try {
      const params = new URLSearchParams(bodyText)
      const items = Array.from(params.entries()).map(([name, value]) => ({ name, value }))
      if (items.length > 0) {
        return (
          <>
            <Section title="Form Data (Decoded)" badge={items.length} defaultOpen>
              <KvTable items={items} decode searchQuery={searchQuery} />
            </Section>
            <Section title="Raw Body">
              <CodeBlock content={bodyText} searchQuery={searchQuery} />
            </Section>
          </>
        )
      }
    } catch { /* fall through */ }
  }

  // XML
  if (mime.includes('xml')) {
    return (
      <Section title="XML Body" defaultOpen>
        <CodeBlock content={bodyText} searchQuery={searchQuery} />
      </Section>
    )
  }

  // Fallback: raw text
  return (
    <Section title="Raw Body" defaultOpen>
      <CodeBlock content={bodyText} searchQuery={searchQuery} />
    </Section>
  )
}
