const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'] as const

export function formatBytes(bytes: number): string {
  if (bytes < 0 || !Number.isFinite(bytes)) return '—'
  if (bytes === 0) return '0 B'
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1)
  const value = bytes / 1024 ** i
  return `${value.toFixed(i === 0 ? 0 : value < 10 ? 1 : value < 100 ? 1 : 0)} ${BYTE_UNITS[i]}`
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || ms < 0 || !Number.isFinite(ms)) return '—'
  if (ms < 1) return '<1 ms'
  if (ms < 1000) return `${Math.round(ms)} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.round((ms % 60_000) / 1000)
  return `${minutes}m ${seconds}s`
}

/** Signed delta, e.g. "+120 ms" / "−1.2 KB". */
export function formatDelta(value: number, formatter: (n: number) => string): string {
  if (value === 0) return '±0'
  return `${value > 0 ? '+' : '−'}${formatter(Math.abs(value))}`
}

const numberFormat = new Intl.NumberFormat()
export const formatNumber = (n: number) => numberFormat.format(n)

export const formatPercent = (ratio: number, digits = 0) => `${(ratio * 100).toFixed(digits)}%`

const timeFormat = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

export function formatTimestamp(iso: string | number | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? String(iso) : timeFormat.format(date)
}

export const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${formatNumber(count)} ${count === 1 ? singular : plural}`

/** Axis tick label: a bare "0" at the origin reads cleaner than "<1 ms". */
export const formatTick = (ms: number) => (ms === 0 ? '0' : formatDuration(ms))
