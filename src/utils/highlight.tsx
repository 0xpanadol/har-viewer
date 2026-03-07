import React from 'react'

export function highlightText(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text
  const q = query.toLowerCase()
  const lower = text.toLowerCase()
  const parts: React.ReactNode[] = []
  let pos = 0
  let idx = lower.indexOf(q, pos)
  while (idx !== -1) {
    if (idx > pos) parts.push(text.slice(pos, idx))
    parts.push(<mark key={idx} className="search-hl">{text.slice(idx, idx + q.length)}</mark>)
    pos = idx + q.length
    idx = lower.indexOf(q, pos)
  }
  if (pos === 0) return text
  if (pos < text.length) parts.push(text.slice(pos))
  return <>{parts}</>
}
