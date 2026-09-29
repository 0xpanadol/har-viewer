import type { HistogramSeries } from '@/har/metrics'
import type { StatusGroup } from '@/har/types'

/** Status dot fills. Always paired with the printed code, never color alone. */
export const STATUS_DOT: Record<StatusGroup, string> = {
  '1xx': 'bg-info',
  '2xx': 'bg-success',
  '3xx': 'bg-info',
  '4xx': 'bg-warning',
  '5xx': 'bg-danger',
  failed: 'bg-danger',
}

export const STATUS_TEXT: Record<StatusGroup, string> = {
  '1xx': 'text-foreground',
  '2xx': 'text-foreground',
  '3xx': 'text-foreground',
  '4xx': 'text-warning',
  '5xx': 'text-danger',
  failed: 'text-danger',
}

/**
 * Status classes grouped for charts, bottom-to-top in stacks. Neutral for success so problems
 * stand out; status hues carry state and are always paired with these labels.
 */
export const STATUS_SERIES: ReadonlyArray<{ key: HistogramSeries; label: string; swatch: string }> = [
  { key: 'ok', label: '1xx–2xx', swatch: 'bg-chart-neutral' },
  { key: 'redirect', label: '3xx', swatch: 'bg-chart-series' },
  { key: 'clientError', label: '4xx', swatch: 'bg-chart-warning' },
  { key: 'serverError', label: '5xx / failed', swatch: 'bg-chart-critical' },
]
