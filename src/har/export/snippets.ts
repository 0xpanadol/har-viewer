import { tryParseJson } from '../decode'
import type { HarEntry } from '../types'

const SKIPPED_HEADERS = new Set(['host', 'content-length', 'connection'])

/** POSIX single-quote escaping: 'it'\''s' */
export const shellQuote = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`
const psQuote = (s: string) => `'${s.replace(/'/g, "''")}'`

interface RequestParts {
  url: string
  method: string
  headers: Array<[string, string]>
  cookie: string
  body: string | undefined
}

function partsOf(raw: HarEntry): RequestParts {
  const request = raw.request
  const headers = (request?.headers ?? [])
    .filter((h) => !SKIPPED_HEADERS.has(h.name.toLowerCase()) && !h.name.startsWith(':'))
    .filter((h) => h.name.toLowerCase() !== 'cookie')
    .map((h): [string, string] => [h.name, h.value])
  const fromCookies = (request?.cookies ?? []).map((c) => `${c.name}=${c.value}`).join('; ')
  const fromHeader = request?.headers?.find((h) => h.name.toLowerCase() === 'cookie')?.value ?? ''
  return {
    url: request?.url ?? '',
    method: request?.method || 'GET',
    headers,
    cookie: fromCookies || fromHeader,
    body: request?.postData?.text || undefined,
  }
}

function headerObject(p: RequestParts): Record<string, string> {
  const headers = Object.fromEntries(p.headers)
  if (p.cookie) headers['Cookie'] = p.cookie
  return headers
}

const indentJson = (value: unknown, pad: string) => JSON.stringify(value, null, 2).replace(/\n/g, `\n${pad}`)

export function toCurl(raw: HarEntry): string {
  const p = partsOf(raw)
  const lines = [`curl ${shellQuote(p.url)}`]
  if (p.method !== 'GET') lines.push(`-X ${p.method}`)
  for (const [name, value] of p.headers) lines.push(`-H ${shellQuote(`${name}: ${value}`)}`)
  if (p.cookie) lines.push(`-b ${shellQuote(p.cookie)}`)
  if (p.body) lines.push(`--data-raw ${shellQuote(p.body)}`)
  return lines.join(' \\\n  ')
}

export function toFetch(raw: HarEntry): string {
  const p = partsOf(raw)
  const options: string[] = []
  if (p.method !== 'GET') options.push(`  method: ${JSON.stringify(p.method)}`)
  const headers = headerObject(p)
  if (Object.keys(headers).length) options.push(`  headers: ${indentJson(headers, '  ')}`)
  if (p.body) options.push(`  body: ${JSON.stringify(p.body)}`)
  const init = options.length ? `, {\n${options.join(',\n')}\n}` : ''
  return `await fetch(${JSON.stringify(p.url)}${init})`
}

export function toAxios(raw: HarEntry): string {
  const p = partsOf(raw)
  const config = [`  url: ${JSON.stringify(p.url)}`, `  method: ${JSON.stringify(p.method.toLowerCase())}`]
  const headers = headerObject(p)
  if (Object.keys(headers).length) config.push(`  headers: ${indentJson(headers, '  ')}`)
  if (p.body) {
    const json = tryParseJson(p.body)
    config.push(`  data: ${json === undefined ? JSON.stringify(p.body) : indentJson(json, '  ')}`)
  }
  return `await axios({\n${config.join(',\n')}\n})`
}

/** Serializes JSON-compatible data as a Python literal (True/False/None, repr-style strings). */
export function toPythonLiteral(value: unknown, pad = ''): string {
  if (value === null || value === undefined) return 'None'
  if (value === true) return 'True'
  if (value === false) return 'False'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return JSON.stringify(value)
  const inner = `${pad}    `
  if (Array.isArray(value)) {
    if (!value.length) return '[]'
    return `[\n${value.map((v) => inner + toPythonLiteral(v, inner)).join(',\n')},\n${pad}]`
  }
  const entries = Object.entries(value as Record<string, unknown>)
  if (!entries.length) return '{}'
  return `{\n${entries.map(([k, v]) => `${inner}${JSON.stringify(k)}: ${toPythonLiteral(v, inner)}`).join(',\n')},\n${pad}}`
}

export function toPython(raw: HarEntry): string {
  const p = partsOf(raw)
  const args = [`    ${JSON.stringify(p.method)}`, `    ${JSON.stringify(p.url)}`]
  const headers = headerObject(p)
  if (Object.keys(headers).length) args.push(`    headers=${toPythonLiteral(headers, '    ')}`)
  if (p.body) {
    const json = tryParseJson(p.body)
    args.push(
      json === undefined ? `    data=${JSON.stringify(p.body)}` : `    json=${toPythonLiteral(json, '    ')}`,
    )
  }
  return `import requests\n\nresponse = requests.request(\n${args.join(',\n')},\n)\nprint(response.status_code)\nprint(response.text)`
}

export function toWget(raw: HarEntry): string {
  const p = partsOf(raw)
  const lines = [`wget ${shellQuote(p.url)}`]
  if (p.method !== 'GET') lines.push(`--method=${p.method}`)
  for (const [name, value] of p.headers) lines.push(`--header=${shellQuote(`${name}: ${value}`)}`)
  if (p.cookie) lines.push(`--header=${shellQuote(`Cookie: ${p.cookie}`)}`)
  if (p.body) lines.push(`--body-data=${shellQuote(p.body)}`)
  lines.push('-O -')
  return lines.join(' \\\n  ')
}

export function toPowerShell(raw: HarEntry): string {
  const p = partsOf(raw)
  const headers = Object.entries(headerObject(p)).map(([k, v]) => `    ${psQuote(k)} = ${psQuote(v)}`)
  const body = p.body ? ` \`\n  -Body ${psQuote(p.body)}` : ''
  return `$headers = @{\n${headers.join('\n')}\n}\n\n$response = Invoke-WebRequest \`\n  -Uri ${psQuote(p.url)} \`\n  -Method ${p.method} \`\n  -Headers $headers${body}\n\n$response.StatusCode\n$response.Content`
}

export function toHttpie(raw: HarEntry): string {
  const p = partsOf(raw)
  const lines = [`http ${p.method} ${shellQuote(p.url)}`]
  for (const [name, value] of p.headers) lines.push(shellQuote(`${name}:${value}`))
  if (p.cookie) lines.push(shellQuote(`Cookie:${p.cookie}`))
  if (p.body) lines.push(`--raw=${shellQuote(p.body)}`)
  return lines.join(' \\\n  ')
}

export const SNIPPET_FORMATS = [
  { id: 'curl', label: 'cURL', build: toCurl },
  { id: 'fetch', label: 'fetch', build: toFetch },
  { id: 'axios', label: 'axios', build: toAxios },
  { id: 'python', label: 'Python requests', build: toPython },
  { id: 'httpie', label: 'HTTPie', build: toHttpie },
  { id: 'wget', label: 'wget', build: toWget },
  { id: 'powershell', label: 'PowerShell', build: toPowerShell },
] as const

export type SnippetFormat = (typeof SNIPPET_FORMATS)[number]
