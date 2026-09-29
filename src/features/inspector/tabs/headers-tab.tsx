import { CopyButton } from '@/components/copy-button'
import { KeyValueList, type KeyValue } from '@/components/key-value-list'
import { Section } from '@/components/section'
import type { Entry, HarNameValue } from '@/har/types'
import { formatTimestamp } from '@/lib/format'

const asText = (headers: HarNameValue[]) => headers.map((h) => `${h.name}: ${h.value}`).join('\n')

export function HeadersTab({ entry }: { entry: Entry }) {
  const { request, response, serverIPAddress, connection, startedDateTime } = entry.raw
  const requestHeaders = request?.headers ?? []
  const responseHeaders = response?.headers ?? []
  const queryString = request?.queryString ?? []

  const general: KeyValue[] = [
    { name: 'Request URL', value: entry.url },
    { name: 'Request method', value: entry.method },
    { name: 'Status code', value: `${entry.status} ${entry.statusText}`.trim() },
    ...(serverIPAddress ? [{ name: 'Remote address', value: serverIPAddress }] : []),
    ...(entry.httpVersion ? [{ name: 'Protocol', value: entry.httpVersion }] : []),
    ...(connection ? [{ name: 'Connection ID', value: connection }] : []),
    ...(response?.redirectURL ? [{ name: 'Redirects to', value: response.redirectURL }] : []),
    { name: 'Started', value: formatTimestamp(startedDateTime) },
  ]

  return (
    <>
      <Section title="General">
        <KeyValueList items={general} />
      </Section>
      <Section
        title="Response headers"
        count={responseHeaders.length}
        actions={<CopyButton value={() => asText(responseHeaders)} label="Copy response headers" />}
      >
        <KeyValueList items={responseHeaders} />
      </Section>
      <Section
        title="Request headers"
        count={requestHeaders.length}
        actions={<CopyButton value={() => asText(requestHeaders)} label="Copy request headers" />}
      >
        <KeyValueList items={requestHeaders} />
      </Section>
      {queryString.length > 0 && (
        <Section title="Query string parameters" count={queryString.length}>
          <KeyValueList items={queryString} decode />
        </Section>
      )}
    </>
  )
}
