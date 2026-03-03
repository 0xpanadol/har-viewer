import type { ParsedEntry } from '../../utils/types'
import { KvTable } from '../KvTable'
import { CodeBlock } from '../CodeBlock'
import { tryParseJson, prettyJson } from '../../utils/parsers'

interface Props {
  entry: ParsedEntry
}

export function PayloadTab({ entry }: Props) {
  const pd = entry._raw.request?.postData

  if (!pd) {
    return <div style={{ color: 'var(--text-3)', padding: 20, textAlign: 'center' }}>No request payload</div>
  }

  return (
    <>
      <div className="section">
        <div className="section-title">Content Type</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-1)', padding: '4px 0' }}>
          {pd.mimeType || ''}
        </div>
      </div>

      {pd.params && pd.params.length > 0 && (
        <div className="section">
          <div className="section-title">
            Form Parameters <span className="badge">{pd.params.length}</span>
          </div>
          <KvTable items={pd.params} decode />
        </div>
      )}

      {pd.text && (
        <div className="section">
          <div className="section-title">Raw Body</div>
          <CodeBlock content={tryParseJson(pd.text) ? prettyJson(tryParseJson(pd.text)) : pd.text} />
        </div>
      )}
    </>
  )
}
