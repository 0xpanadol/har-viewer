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
    <>
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

      {bodyText && (
        <Section title="Raw Body" defaultOpen>
          <CodeBlock content={tryParseJson(bodyText) ? prettyJson(tryParseJson(bodyText)) : bodyText} searchQuery={searchQuery} />
        </Section>
      )}
    </>
  )
}
