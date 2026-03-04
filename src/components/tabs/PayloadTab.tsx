import type { ParsedEntry } from '../../utils/types'
import { KvTable } from '../KvTable'
import { CodeBlock } from '../CodeBlock'
import { Section } from '../Section'
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
      <Section title="Content Type" defaultOpen>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-1)', padding: '4px 0' }}>
          {pd.mimeType || ''}
        </div>
      </Section>

      {pd.params && pd.params.length > 0 && (
        <Section title="Form Parameters" badge={pd.params.length} defaultOpen>
          <KvTable items={pd.params} decode />
        </Section>
      )}

      {pd.text && (
        <Section title="Raw Body" defaultOpen>
          <CodeBlock content={tryParseJson(pd.text) ? prettyJson(tryParseJson(pd.text)) : pd.text} />
        </Section>
      )}
    </>
  )
}
