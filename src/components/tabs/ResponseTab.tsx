import type { ParsedEntry } from '../../utils/types'
import { ResponseViewer } from '../ResponseViewer'
import { Section } from '../Section'
import { tryDecodeBase64 } from '../../utils/parsers'

interface Props {
  entry: ParsedEntry
  externalSearch?: string
}

function detectLanguage(mimeType: string): 'json' | 'html' | 'xml' | 'text' {
  if (/json/i.test(mimeType)) return 'json'
  if (/html/i.test(mimeType)) return 'html'
  if (/xml/i.test(mimeType)) return 'xml'
  return 'text'
}

export function ResponseTab({ entry, externalSearch }: Props) {
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

  if (isImage) {
    const handleDownloadImage = () => {
      const ext = (content.mimeType.split('/')[1] || 'png').replace(/\+.*$/, '')
      const byteChars = atob(content.text!)
      const byteArray = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i)
      const blob = new Blob([byteArray], { type: content.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `response.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    }

    const downloadBtn = (
      <button
        className="rv-btn"
        onClick={handleDownloadImage}
        title="Download image"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
    )

    return (
      <div className="rv-tab-root">
        <Section title="Image Preview" titleExtra={downloadBtn} defaultOpen>
          <img
            src={`data:${content.mimeType};base64,${content.text}`}
            style={{ maxWidth: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
            alt="Response preview"
          />
        </Section>
      </div>
    )
  }

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
          externalSearch={externalSearch}
        />
      )}
    </div>
  )
}
