import { Paperclip } from 'lucide-react'
import { CodeBlock } from '@/components/code-block'
import { Highlight } from '@/components/highlight'
import { KeyValueList } from '@/components/key-value-list'
import { Section } from '@/components/section'
import { prettyJson, tryParseJson } from '@/har/decode'
import { formatBytes } from '@/lib/format'

interface GraphQlBody {
  query: string
  operationName?: string
  variables?: Record<string, unknown>
}

const isGraphQl = (value: unknown): value is GraphQlBody =>
  typeof value === 'object' && value !== null && typeof (value as GraphQlBody).query === 'string'

function GraphQl({ body, raw }: { body: GraphQlBody; raw: unknown }) {
  return (
    <>
      <Section title={body.operationName ? `GraphQL · ${body.operationName}` : 'GraphQL query'}>
        <CodeBlock content={body.query} />
      </Section>
      {body.variables && Object.keys(body.variables).length > 0 && (
        <Section title="Variables" count={Object.keys(body.variables).length}>
          <CodeBlock content={prettyJson(body.variables)} />
        </Section>
      )}
      <Section title="Raw body" defaultOpen={false}>
        <CodeBlock content={prettyJson(raw)} />
      </Section>
    </>
  )
}

function Multipart({ text, boundary }: { text: string; boundary: string }) {
  const parts = text.split(`--${boundary}`).filter((p) => p.trim() && p.trim() !== '--')
  return (
    <Section title="Multipart form data" count={parts.length}>
      <ul className="flex flex-col gap-2 px-3">
        {parts.map((part, i) => {
          const [head = '', ...rest] = part.split(/\r?\n\r?\n/)
          const body = rest.join('\n\n').trim()
          const name = head.match(/name="([^"]*)"/)?.[1]
          const file = head.match(/filename="([^"]*)"/)?.[1]
          const type = head.match(/Content-Type:\s*(.+)/i)?.[1]?.trim()
          return (
            <li key={i} className="rounded-md border bg-muted/40 p-2.5 font-mono text-xs">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {name && (
                  <span className="text-syntax-key">
                    <Highlight text={name} />
                  </span>
                )}
                {file && (
                  <span className="inline-flex items-center gap-1 text-syntax-attr">
                    <Paperclip className="size-3" />
                    <Highlight text={file} />
                  </span>
                )}
                {type && <span className="text-subtle-foreground">{type}</span>}
              </div>
              {body.length > 4000 ? (
                <span className="text-subtle-foreground">
                  Binary or large content · {formatBytes(body.length)}
                </span>
              ) : (
                <pre className="max-h-32 overflow-auto break-all whitespace-pre-wrap text-muted-foreground">
                  <Highlight text={body} />
                </pre>
              )}
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

/** Picks the most useful rendering for a request body based on its type and shape. */
export function PayloadBody({ text, mimeType }: { text: string; mimeType: string }) {
  const mime = mimeType.toLowerCase()
  const json = tryParseJson(text)

  if (json !== undefined) {
    if (isGraphQl(json)) return <GraphQl body={json} raw={json} />
    return (
      <Section title="JSON body">
        <CodeBlock content={prettyJson(json)} />
      </Section>
    )
  }

  const boundary = mimeType.match(/boundary=([^\s;]+)/)?.[1]
  if (mime.includes('multipart') && boundary) return <Multipart text={text} boundary={boundary} />

  if (mime.includes('x-www-form-urlencoded') && text.includes('=')) {
    const fields = [...new URLSearchParams(text)].map(([name, value]) => ({ name, value }))
    return (
      <>
        <Section title="Form data" count={fields.length}>
          <KeyValueList items={fields} decode />
        </Section>
        <Section title="Raw body" defaultOpen={false}>
          <CodeBlock content={text} />
        </Section>
      </>
    )
  }

  return (
    <Section title={mime.includes('xml') ? 'XML body' : 'Body'}>
      <CodeBlock content={text} />
    </Section>
  )
}
