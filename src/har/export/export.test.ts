import { describe, expect, it } from 'vitest'
import { entry, harEntry } from '../test-utils'
import { mergeLogs, sanitizeEntries } from './har'
import { shellQuote, toCurl, toPython, toPythonLiteral } from './snippets'
import { toCookieHeader, toCsv, toNetscapeCookies } from './tabular'

describe('snippets', () => {
  it('shell-quotes single quotes safely', () => {
    expect(shellQuote(`it's`)).toBe(`'it'\\''s'`)
  })

  it('builds a curl command with method, headers and body', () => {
    const raw = harEntry({
      method: 'POST',
      url: "https://api.x.com/q?name=o'neil",
      requestHeaders: [
        { name: 'content-type', value: 'application/json' },
        { name: 'content-length', value: '10' },
        { name: ':authority', value: 'api.x.com' },
      ],
      requestBody: '{"a":1}',
    })
    const curl = toCurl(raw)
    expect(curl).toContain(`curl 'https://api.x.com/q?name=o'\\''neil'`)
    expect(curl).toContain('-X POST')
    expect(curl).toContain(`-H 'content-type: application/json'`)
    expect(curl).not.toContain('content-length')
    expect(curl).not.toContain(':authority')
    expect(curl).toContain(`--data-raw '{"a":1}'`)
  })

  it('emits real Python literals without corrupting string values', () => {
    expect(toPythonLiteral({ a: true, b: null, c: ['true'] })).toBe(
      '{\n    "a": True,\n    "b": None,\n    "c": [\n        "true",\n    ],\n}',
    )
    const code = toPython(harEntry({ url: 'https://x.com/?debug=true' }))
    expect(code).toContain('"https://x.com/?debug=true"')
  })
})

describe('sanitizeEntries', () => {
  it('redacts credentials without mutating the original', () => {
    const original = harEntry({
      url: 'https://x.com/cb?code=secret&page=2',
      requestHeaders: [
        { name: 'Authorization', value: 'Bearer abc' },
        { name: 'Accept', value: '*/*' },
      ],
      requestBody: '{"password":"hunter2"}',
    })
    const [clean] = sanitizeEntries([original])
    expect(clean!.request.headers.find((h) => h.name === 'Authorization')!.value).toBe('[REDACTED]')
    expect(clean!.request.headers.find((h) => h.name === 'Accept')!.value).toBe('*/*')
    expect(clean!.request.url).toContain('code=%5BREDACTED%5D')
    expect(clean!.request.url).toContain('page=2')
    expect(clean!.request.postData!.text).toMatch(/REDACTED/)
    expect(original.request.headers[0]!.value).toBe('Bearer abc')
  })
})

describe('tabular exports', () => {
  it('escapes CSV cells', () => {
    const csv = toCsv([entry(0, { url: 'https://x.com/a,"b"' })])
    expect(csv.split('\n')[1]).toContain('"https://x.com/a,""b"""')
  })

  it('de-duplicates cookies by domain and name', () => {
    const a = harEntry({ url: 'https://x.com/' })
    a.request.cookies = [
      { name: 'sid', value: '1' },
      { name: 'sid', value: '2' },
    ]
    const txt = toNetscapeCookies([a])
    expect(txt.match(/\tsid\t/g)).toHaveLength(1)
    expect(toCookieHeader([a])).toBe('sid=1')
  })
})

describe('mergeLogs', () => {
  it('orders merged entries chronologically', () => {
    const merged = mergeLogs([{ entries: [harEntry({ start: 50 })] }, { entries: [harEntry({ start: 10 })] }])
    expect(merged.entries.map((e) => e.startedDateTime)).toEqual(
      [...merged.entries.map((e) => e.startedDateTime)].sort(),
    )
  })
})
