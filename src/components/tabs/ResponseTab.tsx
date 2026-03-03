import type { ParsedEntry } from '../../utils/types'
import { ResponseViewer } from '../ResponseViewer'
import { tryDecodeBase64 } from '../../utils/parsers'

interface Props {
  entry: ParsedEntry
}

function detectLanguage(mimeType: string): 'json' | 'html' | 'xml' | 'text' {
  if (/json/i.test(mimeType)) return 'json'
  if (/html/i.test(mimeType)) return 'html'
  if (/xml/i.test(mimeType)) return 'xml'
  return 'text'
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

  const isImage = /^image\//i.test(content.mimeType) && content.text && content.encoding === 'base64'
  const language = detectLanguage(content.mimeType || '')

  if (language === 'json') {
    try {
      bodyText = JSON.stringify(JSON.parse(bodyText), null, 2)
    } catch { /* keep as-is */ }
  }

  return (
    <div className="rv-tab-root">
      {bodyText && (
        <ResponseViewer
          content={bodyText}
          language={language}
          rawBytes={content.size || 0}
          mimeType={content.mimeType}
        />
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
    </div>
  )
}
