import type { ParsedEntry } from '../../utils/types'
import { CodeBlock } from '../CodeBlock'
import { formatBytes } from '../../utils/formatters'
import { prettyJson } from '../../utils/parsers'

interface Props {
  entry: ParsedEntry
}

export function RawTab({ entry }: Props) {
  const raw = entry._raw
  // Create a copy without the potentially huge response body
  const display = JSON.parse(JSON.stringify(raw))
  if (display.response?.content?.text && display.response.content.text.length > 2000) {
    const totalLen = raw.response.content.text?.length || 0
    display.response.content.text =
      display.response.content.text.slice(0, 2000) +
      `\n... [${formatBytes(totalLen)} total — truncated for display]`
  }

  return (
    <div className="section">
      <div className="section-title">Raw HAR Entry</div>
      <CodeBlock content={prettyJson(display)} />
    </div>
  )
}
