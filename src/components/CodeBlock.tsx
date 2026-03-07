import { useCallback, useRef } from 'react'
import { formatBytes } from '../utils/formatters'
import { highlightText } from '../utils/highlight'

const MAX_DISPLAY = 500000

interface Props {
  content: string
  searchQuery?: string
}

export function CodeBlock({ content, searchQuery = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const truncated = content.length > MAX_DISPLAY
  const display = truncated ? content.slice(0, MAX_DISPLAY) : content

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      const btn = ref.current?.querySelector('.copy-btn') as HTMLButtonElement
      if (btn) {
        btn.textContent = 'Copied!'
        setTimeout(() => (btn.textContent = 'Copy'), 1500)
      }
    })
  }, [content])

  return (
    <div className="code-block" ref={ref}>
      <button className="copy-btn" onClick={handleCopy}>Copy</button>
      {highlightText(display, searchQuery)}
      {truncated && `\n\n... [truncated — ${formatBytes(content.length)} total]`}
    </div>
  )
}
