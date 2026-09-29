import { describe, expect, it } from 'vitest'
import { diffCaptures, diffHeaders } from './compare'
import { buildInitiatorTree } from './initiators'
import { detectIssues } from './issues'
import { captureRange, normalizeLog, statusGroup, toEntries } from './parse'
import { createSampleLog } from './sample'
import { entry } from './test-utils'
import { phaseSegments } from './timings'

describe('parse', () => {
  it('accepts a document or a bare log and rejects non-HAR JSON', () => {
    const log = { entries: [] }
    expect(normalizeLog({ log })).toBe(log)
    expect(normalizeLog(log)).toBe(log)
    expect(() => normalizeLog({ foo: 1 })).toThrow(/log.entries/)
  })

  it('maps status codes to groups', () => {
    expect(statusGroup(0)).toBe('failed')
    expect(statusGroup(204)).toBe('2xx')
    expect(statusGroup(304)).toBe('3xx')
    expect(statusGroup(599)).toBe('5xx')
  })

  it('restores stable ids only when they align with the entries', () => {
    const log = createSampleLog()
    const ids = log.entries.map((_, i) => i * 10)
    expect(toEntries(log, ids)[3]!.id).toBe(30)
    expect(toEntries(log, [1, 2])[3]!.id).toBe(3)
  })

  it('computes the capture range without spreading large arrays', () => {
    const many = Array.from({ length: 200_000 }, (_, i) => entry(i, { start: i, time: 5 }))
    expect(captureRange(many)).toEqual({ start: many[0]!.startTime, end: many.at(-1)!.startTime + 5 })
  })
})

describe('phaseSegments', () => {
  it('lays phases end to end and subtracts TLS from connect', () => {
    const e = entry(0)
    e.timings = { blocked: 2, dns: 5, connect: 30, ssl: 20, send: 1, wait: 100, receive: 10 }
    const segments = phaseSegments(e)
    expect(segments.map((s) => [s.key, s.duration, s.offset])).toEqual([
      ['blocked', 2, 0],
      ['dns', 5, 2],
      ['connect', 10, 7],
      ['ssl', 20, 17],
      ['send', 1, 37],
      ['wait', 100, 38],
      ['receive', 10, 138],
    ])
  })
})

describe('detectIssues', () => {
  const byId = (checks: ReturnType<typeof detectIssues>, id: string) => checks.find((c) => c.id === id)!

  it('flags errors, slow TTFB and duplicates', () => {
    const checks = detectIssues([
      entry(0, { url: 'https://x.com/a', status: 500 }),
      entry(1, { url: 'https://x.com/b', wait: 1500 }),
      entry(2, { url: 'https://x.com/b', wait: 10 }),
    ])
    expect(byId(checks, 'errors').items).toHaveLength(1)
    expect(byId(checks, 'ttfb').items[0]!.entries[0]!.id).toBe(1)
    expect(byId(checks, 'duplicates').items[0]!.metric).toBe('×2')
  })

  it('follows redirect chains to the final response', () => {
    const checks = detectIssues([
      entry(0, { url: 'http://x.com/', status: 301, redirectURL: 'https://x.com/' }),
      entry(1, { url: 'https://x.com/', status: 302, redirectURL: 'https://x.com/home' }),
      entry(2, { url: 'https://x.com/home', status: 200 }),
    ])
    const chain = byId(checks, 'redirects').items[0]!
    expect(chain.entries.map((e) => e.id)).toEqual([0, 1, 2])
    expect(chain.metric).toBe('2 hops')
    expect(byId(checks, 'mixed').items).toHaveLength(1)
  })

  it('finds issues in the sample capture', () => {
    const checks = detectIssues(toEntries(createSampleLog()))
    expect(byId(checks, 'errors').items.length).toBeGreaterThanOrEqual(3)
    expect(byId(checks, 'redirects').items).toHaveLength(1)
  })
})

describe('compare', () => {
  it('matches endpoints ignoring query strings', () => {
    const before = [
      entry(0, { url: 'https://x.com/a?v=1', time: 100 }),
      entry(1, { url: 'https://x.com/gone' }),
    ]
    const after = [
      entry(0, { url: 'https://x.com/a?v=2', time: 400 }),
      entry(1, { url: 'https://x.com/new' }),
    ]
    const diff = diffCaptures(before, after)
    expect(diff.added.map((e) => e.url)).toEqual(['https://x.com/new'])
    expect(diff.removed.map((e) => e.url)).toEqual(['https://x.com/gone'])
    expect(diff.changed[0]!.timeDelta).toBe(300)
  })

  it('diffs headers case-insensitively', () => {
    const delta = diffHeaders(
      [
        { name: 'A', value: '1' },
        { name: 'B', value: '2' },
      ],
      [
        { name: 'a', value: '1' },
        { name: 'C', value: '3' },
      ],
    )
    expect(delta).toEqual([
      { name: 'b', before: '2', after: undefined },
      { name: 'c', before: undefined, after: '3' },
    ])
  })
})

describe('buildInitiatorTree', () => {
  it('nests requests under their initiator and never cycles', () => {
    const tree = buildInitiatorTree([
      entry(0, { url: 'https://x.com/', start: 0 }),
      entry(1, { url: 'https://x.com/app.js', start: 10, initiator: 'https://x.com/' }),
      entry(2, { url: 'https://x.com/api', start: 20, initiator: 'https://x.com/app.js' }),
      entry(3, { url: 'https://x.com/loop', start: 30, initiator: 'https://x.com/loop' }),
    ])
    expect(tree.map((n) => n.entry.id)).toEqual([0, 3])
    expect(tree[0]!.size).toBe(2)
    expect(tree[0]!.children[0]!.children[0]!.entry.id).toBe(2)
  })
})
