import type { ParsedEntry } from '../../utils/types'
import { CodeBlock } from '../CodeBlock'
import { formatBytes } from '../../utils/formatters'
import { tryDecodeBase64, tryParseJson, prettyJson } from '../../utils/parsers'

interface Props {
  entry: ParsedEntry
}

export function ResponseTab({ entry }: Props) {
  const content = entry._raw.response?.content

  if (!content || (!content.text && !content.encoding)) {
    return <div style={{ color: 'var(--text-3)', padding: 20, textAlign: 'center' }}>No response body captured</div>
  }

  let bodyText = content.text || ''
  if (content.encoding === 'base64') {
    const decoded = tryDecodeBase64(bodyText)
    if (decoded) bodyText = decoded
  }

  const jsonParsed = tryParseJson(bodyText)
  const isImage = /^image\//i.test(content.mimeType) && content.text && content.encoding === 'base64'

  return (
    <>
      <div className="section">
        <div className="section-title">Response Info</div>
        <table className="kv-table">
          <tbody>
            <tr><td className="kv-key">MIME Type</td><td className="kv-val">{content.mimeType || ''}</td></tr>
            <tr><td className="kv-key">Size</td><td className="kv-val">{formatBytes(content.size || 0)}</td></tr>
            {content.compression != null && (
              <tr><td className="kv-key">Compression</td><td className="kv-val">{formatBytes(content.compression)}</td></tr>
            )}
            {content.encoding && (
              <tr><td className="kv-key">Encoding</td><td className="kv-val">{content.encoding}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {bodyText && (
        <div className="section">
          <div className="section-title">Body Preview</div>
          <CodeBlock content={jsonParsed ? prettyJson(jsonParsed) : bodyText} />
        </div>
      )}

      {isImage && (
        <div className="section">
          <div className="section-title">Image Preview</div>
          <img
            src={`data:${content.mimeType};base64,${content.text}`}
            style={{ maxWidth: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
            alt="Response preview"
          />
        </div>
      )}
    </>
  )
}
