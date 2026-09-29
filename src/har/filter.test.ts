import { describe, expect, it } from 'vitest'
import {
  applyTimeWindow,
  compileMatcher,
  countActiveFilters,
  EMPTY_CRITERIA,
  filterEntries,
  parseByteSize,
  pinFirst,
  sortEntries,
} from './filter'
import { entry } from './test-utils'

const entries = [
  entry(0, { method: 'GET', url: 'https://a.com/api/users', status: 200, time: 120, size: 2048 }),
  entry(1, {
    method: 'POST',
    url: 'https://a.com/api/login',
    status: 401,
    time: 900,
    size: 64,
    requestBody: '{"password":"x"}',
  }),
  entry(2, {
    method: 'GET',
    url: 'https://cdn.b.com/app.js',
    status: 200,
    mime: 'application/javascript',
    time: 40,
    size: 90_000,
  }),
  entry(3, {
    method: 'GET',
    url: 'https://a.com/health',
    status: 503,
    time: 3000,
    size: 10,
    responseHeaders: [{ name: 'x-trace', value: 'abc123' }],
  }),
]

describe('filterEntries', () => {
  it('returns everything for empty criteria', () => {
    expect(filterEntries(entries, EMPTY_CRITERIA)).toHaveLength(4)
  })

  it('ORs values within a facet and ANDs across facets', () => {
    const result = filterEntries(entries, { ...EMPTY_CRITERIA, statuses: ['4xx', '5xx'], methods: ['GET'] })
    expect(result.map((e) => e.id)).toEqual([3])
  })

  it('filters by domain, duration and size ranges', () => {
    expect(filterEntries(entries, { ...EMPTY_CRITERIA, domains: ['a.com'] })).toHaveLength(3)
    expect(
      filterEntries(entries, { ...EMPTY_CRITERIA, minTime: 100, maxTime: 1000 }).map((e) => e.id),
    ).toEqual([0, 1])
    expect(filterEntries(entries, { ...EMPTY_CRITERIA, minSize: 1024 }).map((e) => e.id)).toEqual([0, 2])
  })

  it('searches the selected scope and supports negation', () => {
    expect(filterEntries(entries, { ...EMPTY_CRITERIA, query: 'api' }).map((e) => e.id)).toEqual([0, 1])
    expect(
      filterEntries(entries, { ...EMPTY_CRITERIA, query: 'api', negate: true }).map((e) => e.id),
    ).toEqual([2, 3])
    expect(filterEntries(entries, { ...EMPTY_CRITERIA, query: 'abc123' })).toHaveLength(0)
    expect(
      filterEntries(entries, { ...EMPTY_CRITERIA, query: 'abc123', scope: 'headers' }).map((e) => e.id),
    ).toEqual([3])
    expect(
      filterEntries(entries, { ...EMPTY_CRITERIA, query: 'password', scope: 'body' }).map((e) => e.id),
    ).toEqual([1])
  })

  it('treats an invalid regex as plain text instead of throwing', () => {
    expect(filterEntries(entries, { ...EMPTY_CRITERIA, query: 'api/(', useRegex: true })).toHaveLength(0)
    expect(filterEntries(entries, { ...EMPTY_CRITERIA, query: 'users|login', useRegex: true })).toHaveLength(
      2,
    )
  })
})

describe('compileMatcher', () => {
  it('is case-insensitive', () => {
    expect(compileMatcher('HeLLo', false)?.('say hello')).toBe(true)
    expect(compileMatcher('^say', true)?.('SAY hi')).toBe(true)
  })
})

describe('sorting and pinning', () => {
  it('sorts with a stable id tiebreak', () => {
    const byTime = sortEntries(entries, { column: 'time', direction: 'desc' })
    expect(byTime.map((e) => e.id)).toEqual([3, 1, 0, 2])
    expect(sortEntries(entries, { column: null, direction: 'asc' })).toBe(entries)
  })

  it('floats pinned entries to the top preserving order', () => {
    expect(pinFirst(entries, new Set([3, 1])).map((e) => e.id)).toEqual([1, 3, 0, 2])
  })
})

describe('applyTimeWindow', () => {
  it('keeps entries whose start offset falls inside the window', () => {
    const timed = [entry(0, { start: 0 }), entry(1, { start: 500 }), entry(2, { start: 1500 })]
    const start = timed[0]!.startTime
    expect(applyTimeWindow(timed, [400, 1000], start).map((e) => e.id)).toEqual([1])
    expect(applyTimeWindow(timed, null, start)).toBe(timed)
  })
})

describe('helpers', () => {
  it('parses human byte sizes', () => {
    expect(parseByteSize('250')).toBe(250)
    expect(parseByteSize('10kb')).toBe(10_240)
    expect(parseByteSize('1.5 MB')).toBe(1_572_864)
    expect(parseByteSize('abc')).toBeNull()
  })

  it('counts active filter groups', () => {
    expect(countActiveFilters(EMPTY_CRITERIA)).toBe(0)
    expect(
      countActiveFilters({
        ...EMPTY_CRITERIA,
        query: 'x',
        methods: ['GET', 'POST'],
        minTime: 10,
        timeWindow: [0, 1],
      }),
    ).toBe(4)
  })
})
