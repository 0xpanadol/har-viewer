import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { formatBytes } from '../utils/formatters'

interface Props {
  content: string
  language: 'json' | 'html' | 'xml' | 'text'
  rawBytes?: number
  mimeType?: string
  externalSearch?: string
}

export function ResponseViewer({ content, language, rawBytes, mimeType, externalSearch }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchIdx, setSearchIdx] = useState(0)
  const [wordWrap, setWordWrap] = useState(true)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [jsonPath, setJsonPath] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Sync external search query from DetailPanel
  useEffect(() => {
    if (externalSearch !== undefined && externalSearch.length >= 2 && externalSearch !== searchQuery) {
      setSearchQuery(externalSearch)
      setSearchIdx(0)
    }
  }, [externalSearch])

  // Search matches
  const matches = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return []
    const results: number[] = []
    const lower = content.toLowerCase()
    const q = searchQuery.toLowerCase()
    let pos = 0
    while (pos < lower.length) {
      const idx = lower.indexOf(q, pos)
      if (idx === -1) break
      results.push(idx)
      pos = idx + 1
    }
    return results
  }, [content, searchQuery])

  // Navigate matches
  const goToMatch = useCallback((idx: number) => {
    setSearchIdx(idx)
    const el = bodyRef.current?.querySelector(`[data-match="${idx}"]`)
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [])

  const nextMatch = useCallback(() => {
    if (matches.length === 0) return
    const next = (searchIdx + 1) % matches.length
    goToMatch(next)
  }, [matches, searchIdx, goToMatch])

  const prevMatch = useCallback(() => {
    if (matches.length === 0) return
    const prev = (searchIdx - 1 + matches.length) % matches.length
    goToMatch(prev)
  }, [matches, searchIdx, goToMatch])

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement === searchInputRef.current) {
        e.preventDefault()
        if (e.shiftKey) prevMatch()
        else nextMatch()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [nextMatch, prevMatch])

  // Copy body
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content)
  }, [content])

  // Download response
  const handleDownload = useCallback(() => {
    let ext = language === 'json' ? '.json' : language === 'html' ? '.html' : language === 'xml' ? '.xml' : '.txt'
    if (mimeType) {
      const sub = mimeType.split('/')[1]?.replace(/\+.*$/, '')
      if (sub && sub !== 'plain' && sub !== 'octet-stream') ext = `.${sub}`
    }
    const blob = new Blob([content], { type: mimeType || 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `response${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, [content, language, mimeType])

  // JSON collapse/expand
  const toggleCollapse = useCallback((path: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const expandAll = useCallback(() => setCollapsed(new Set()), [])
  const collapseAll = useCallback(() => {
    if (language !== 'json') return
    const paths = new Set<string>()
    const collectPaths = (obj: unknown, path: string) => {
      if (obj && typeof obj === 'object') {
        paths.add(path)
        if (Array.isArray(obj)) {
          obj.forEach((_, i) => collectPaths(obj[i], `${path}[${i}]`))
        } else {
          Object.keys(obj as Record<string, unknown>).forEach(k =>
            collectPaths((obj as Record<string, unknown>)[k], `${path}.${k}`)
          )
        }
      }
    }
    try { collectPaths(JSON.parse(content), '$') } catch { /* ignore */ }
    setCollapsed(paths)
  }, [content, language])

  // Render content based on language
  const rendered = useMemo(() => {
    if (language === 'json') {
      try {
        const parsed = JSON.parse(content)
        return renderJson(parsed, '$', 0, collapsed, toggleCollapse, setJsonPath, searchQuery, matches, searchIdx)
      } catch {
        return renderPlainText(content, showLineNumbers, searchQuery, matches, searchIdx)
      }
    }
    if (language === 'html' || language === 'xml') {
      return renderHtml(content, showLineNumbers, searchQuery, matches, searchIdx)
    }
    return renderPlainText(content, showLineNumbers, searchQuery, matches, searchIdx)
  }, [content, language, collapsed, toggleCollapse, showLineNumbers, searchQuery, matches, searchIdx])

  return (
    <div className="rv-container">
      {/* Toolbar */}
      <div className="rv-toolbar">
        <div className="rv-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rv-search-icon">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef}
            className="rv-search"
            type="text"
            placeholder="Search in response..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchIdx(0) }}
          />
          {matches.length > 0 && (
            <span className="rv-match-count">{searchIdx + 1}/{matches.length}</span>
          )}
          {searchQuery.length >= 2 && matches.length === 0 && (
            <span className="rv-match-count rv-no-match">0 results</span>
          )}
          {matches.length > 0 && (
            <div className="rv-match-nav">
              <button onClick={prevMatch} title="Previous match (Shift+Enter)">↑</button>
              <button onClick={nextMatch} title="Next match (Enter)">↓</button>
            </div>
          )}
        </div>
        <div className="rv-actions">
          {language === 'json' && (
            <>
              <button className="rv-btn" onClick={expandAll} title="Expand all">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <button className="rv-btn" onClick={collapseAll} title="Collapse all">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 15 12 9 18 15"/></svg>
              </button>
              <div className="rv-sep" />
            </>
          )}
          <button className={`rv-btn ${showLineNumbers ? 'active' : ''}`} onClick={() => setShowLineNumbers(!showLineNumbers)} title="Toggle line numbers">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="6" y2="6"/><line x1="3" y1="12" x2="6" y2="12"/><line x1="3" y1="18" x2="6" y2="18"/><line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/></svg>
          </button>
          <button className={`rv-btn ${wordWrap ? 'active' : ''}`} onClick={() => setWordWrap(!wordWrap)} title="Toggle word wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h15a3 3 0 110 6h-4"/><polyline points="16 16 14 18 16 20"/><line x1="3" y1="18" x2="7" y2="18"/></svg>
          </button>
          <div className="rv-sep" />
          <button className="rv-btn" onClick={handleCopy} title="Copy response body">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
          <button className="rv-btn" onClick={handleDownload} title="Download response">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>
      </div>

      {/* JSON path breadcrumb */}
      {language === 'json' && jsonPath && (
        <div className="rv-json-path" onClick={() => navigator.clipboard.writeText(jsonPath)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12, flexShrink: 0 }}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          <span>{jsonPath}</span>
          <span className="rv-path-copy">click to copy</span>
        </div>
      )}

      {/* Size info */}
      {rawBytes != null && rawBytes > 0 && (
        <div className="rv-size-bar">
          {formatBytes(rawBytes)} · {content.split('\n').length} lines · {language.toUpperCase()}
        </div>
      )}

      {/* Body */}
      <div
        className={`rv-body ${wordWrap ? 'wrap' : 'nowrap'}`}
        ref={bodyRef}
      >
        {rendered}
      </div>
    </div>
  )
}


// ─── JSON Renderer ───
function renderJson(
  value: unknown,
  path: string,
  depth: number,
  collapsed: Set<string>,
  toggleCollapse: (path: string) => void,
  setJsonPath: (path: string) => void,
  searchQuery: string,
  matches: number[],
  searchIdx: number,
  _parentIsArray = false
): React.ReactNode {
  const indent = '  '.repeat(depth)
  const isCollapsed = collapsed.has(path)

  if (value === null) return <span className="rv-null" onMouseEnter={() => setJsonPath(path)}>null</span>
  if (typeof value === 'boolean') return <span className="rv-bool" onMouseEnter={() => setJsonPath(path)}>{String(value)}</span>
  if (typeof value === 'number') return <span className="rv-num" onMouseEnter={() => setJsonPath(path)}>{String(value)}</span>
  if (typeof value === 'string') {
    const display = JSON.stringify(value)
    return <span className="rv-str" onMouseEnter={() => setJsonPath(path)}>{highlightSearch(display, searchQuery, matches, searchIdx)}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span onMouseEnter={() => setJsonPath(path)}>{'[]'}</span>
    const preview = `Array(${value.length})`
    return (
      <span onMouseEnter={() => setJsonPath(path)}>
        <span className="rv-toggle" onClick={() => toggleCollapse(path)}>{isCollapsed ? '▶' : '▼'}</span>
        {'['}
        {isCollapsed ? (
          <span className="rv-collapsed" onClick={() => toggleCollapse(path)}> {preview} </span>
        ) : (
          <>
            {'\n'}
            {value.map((item, i) => (
              <span key={i}>
                {indent}{'  '}
                {renderJson(item, `${path}[${i}]`, depth + 1, collapsed, toggleCollapse, setJsonPath, searchQuery, matches, searchIdx, true)}
                {i < value.length - 1 ? ',' : ''}
                {'\n'}
              </span>
            ))}
            {indent}
          </>
        )}
        {']'}
      </span>
    )
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>)
    if (keys.length === 0) return <span onMouseEnter={() => setJsonPath(path)}>{'{}'}</span>
    const preview = `{${keys.length} keys}`
    return (
      <span onMouseEnter={() => setJsonPath(path)}>
        <span className="rv-toggle" onClick={() => toggleCollapse(path)}>{isCollapsed ? '▶' : '▼'}</span>
        {'{'}
        {isCollapsed ? (
          <span className="rv-collapsed" onClick={() => toggleCollapse(path)}> {preview} </span>
        ) : (
          <>
            {'\n'}
            {keys.map((key, i) => (
              <span key={key}>
                {indent}{'  '}
                <span className="rv-key" onMouseEnter={() => setJsonPath(`${path}.${key}`)}>
                  {highlightSearch(`"${key}"`, searchQuery, matches, searchIdx)}
                </span>
                {': '}
                {renderJson((value as Record<string, unknown>)[key], `${path}.${key}`, depth + 1, collapsed, toggleCollapse, setJsonPath, searchQuery, matches, searchIdx)}
                {i < keys.length - 1 ? ',' : ''}
                {'\n'}
              </span>
            ))}
            {indent}
          </>
        )}
        {'}'}
      </span>
    )
  }

  return <span>{String(value)}</span>
}

// ─── HTML/XML Renderer with syntax coloring ───
function renderHtml(
  content: string,
  showLineNumbers: boolean,
  searchQuery: string,
  matches: number[],
  searchIdx: number
): React.ReactNode {
  const lines = content.split('\n')
  return (
    <table className="rv-lines">
      <tbody>
        {lines.map((line, i) => (
          <tr key={i}>
            {showLineNumbers && <td className="rv-ln">{i + 1}</td>}
            <td className="rv-lc">
              {highlightHtmlLine(line, searchQuery, matches, searchIdx, lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function highlightHtmlLine(
  line: string,
  searchQuery: string,
  matches: number[],
  searchIdx: number,
  lineOffset: number
): React.ReactNode {
  // Simple HTML syntax highlighting
  const parts: React.ReactNode[] = []
  let remaining = line
  let pos = 0

  while (remaining.length > 0) {
    // Tags
    const tagMatch = remaining.match(/^(<\/?[a-zA-Z][a-zA-Z0-9-]*)([\s\S]*?)(\/?>)/)
    if (tagMatch) {
      parts.push(<span key={pos} className="rv-tag">{tagMatch[1]}</span>)
      // Attributes
      const attrs = tagMatch[2]
      if (attrs) {
        parts.push(highlightAttrs(attrs, pos + tagMatch[1].length))
      }
      parts.push(<span key={pos + tagMatch[0].length - tagMatch[3].length} className="rv-tag">{tagMatch[3]}</span>)
      remaining = remaining.slice(tagMatch[0].length)
      pos += tagMatch[0].length
      continue
    }

    // Comment
    const commentMatch = remaining.match(/^(<!--[\s\S]*?-->)/)
    if (commentMatch) {
      parts.push(<span key={pos} className="rv-comment">{commentMatch[1]}</span>)
      remaining = remaining.slice(commentMatch[0].length)
      pos += commentMatch[0].length
      continue
    }

    // Text content - take until next tag
    const nextTag = remaining.indexOf('<')
    if (nextTag > 0) {
      const text = remaining.slice(0, nextTag)
      parts.push(highlightSearchInSpan(text, searchQuery, matches, searchIdx, lineOffset + pos, pos))
      remaining = remaining.slice(nextTag)
      pos += nextTag
    } else if (nextTag === -1) {
      parts.push(highlightSearchInSpan(remaining, searchQuery, matches, searchIdx, lineOffset + pos, pos))
      break
    } else {
      // nextTag === 0 but no match — just take one char
      parts.push(remaining[0])
      remaining = remaining.slice(1)
      pos += 1
    }
  }

  return <>{parts}</>
}

function highlightAttrs(attrs: string, _offset: number): React.ReactNode {
  const parts: React.ReactNode[] = []
  const re = /([a-zA-Z-]+)(="[^"]*")?/g
  let match
  let lastIdx = 0
  while ((match = re.exec(attrs)) !== null) {
    if (match.index > lastIdx) {
      parts.push(attrs.slice(lastIdx, match.index))
    }
    parts.push(<span key={match.index} className="rv-attr">{match[1]}</span>)
    if (match[2]) {
      parts.push(<span key={match.index + match[1].length} className="rv-attr-val">{match[2]}</span>)
    }
    lastIdx = re.lastIndex
  }
  if (lastIdx < attrs.length) parts.push(attrs.slice(lastIdx))
  return <>{parts}</>
}

// ─── Plain text renderer ───
function renderPlainText(
  content: string,
  showLineNumbers: boolean,
  searchQuery: string,
  matches: number[],
  searchIdx: number
): React.ReactNode {
  const lines = content.split('\n')
  return (
    <table className="rv-lines">
      <tbody>
        {lines.map((line, i) => {
          const lineOffset = lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0)
          return (
            <tr key={i}>
              {showLineNumbers && <td className="rv-ln">{i + 1}</td>}
              <td className="rv-lc">
                {highlightSearchInSpan(line, searchQuery, matches, searchIdx, lineOffset, i)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ─── Search highlighting helpers ───
function highlightSearch(
  text: string,
  searchQuery: string,
  matches: number[],
  searchIdx: number
): React.ReactNode {
  if (!searchQuery || searchQuery.length < 2 || matches.length === 0) return text
  // Simple inline highlight — for JSON keys/values
  const q = searchQuery.toLowerCase()
  const lower = text.toLowerCase()
  const parts: React.ReactNode[] = []
  let pos = 0
  let idx = lower.indexOf(q, pos)
  while (idx !== -1) {
    if (idx > pos) parts.push(text.slice(pos, idx))
    parts.push(<mark key={idx} className="rv-highlight">{text.slice(idx, idx + q.length)}</mark>)
    pos = idx + q.length
    idx = lower.indexOf(q, pos)
  }
  if (pos < text.length) parts.push(text.slice(pos))
  return parts.length > 0 ? <>{parts}</> : text
}

function highlightSearchInSpan(
  text: string,
  searchQuery: string,
  matches: number[],
  searchIdx: number,
  globalOffset: number,
  key: number
): React.ReactNode {
  if (!searchQuery || searchQuery.length < 2 || matches.length === 0) return text
  const q = searchQuery.toLowerCase()
  const qLen = q.length
  const parts: React.ReactNode[] = []
  let pos = 0

  for (let mi = 0; mi < matches.length; mi++) {
    const matchStart = matches[mi] - globalOffset
    const matchEnd = matchStart + qLen
    if (matchEnd <= 0 || matchStart >= text.length) continue
    const clampStart = Math.max(0, matchStart)
    const clampEnd = Math.min(text.length, matchEnd)
    if (clampStart > pos) parts.push(text.slice(pos, clampStart))
    const isActive = mi === searchIdx
    parts.push(
      <mark key={`${key}-${mi}`} className={`rv-highlight ${isActive ? 'rv-active' : ''}`} data-match={mi}>
        {text.slice(clampStart, clampEnd)}
      </mark>
    )
    pos = clampEnd
  }

  if (pos === 0) return text
  if (pos < text.length) parts.push(text.slice(pos))
  return <>{parts}</>
}
