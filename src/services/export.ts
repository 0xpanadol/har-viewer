import { toast } from 'sonner'
import { buildHarDocument, sanitizeEntries } from '@/har/export/har'
import { toPostmanCollection } from '@/har/export/postman'
import { toCookieJson, toCsv, toNetscapeCookies } from '@/har/export/tabular'
import type { Entry } from '@/har/types'
import { baseName, downloadJson, downloadText } from '@/lib/download'
import { pluralize } from '@/lib/format'
import { useAppStore } from '@/store'
import { selectVisibleEntries } from '@/store/selectors'

export type ExportFormat = 'har' | 'har-sanitized' | 'csv' | 'postman' | 'cookies-netscape' | 'cookies-json'

export const EXPORT_FORMATS: ReadonlyArray<{ id: ExportFormat; label: string; hint: string }> = [
  { id: 'har', label: 'HAR', hint: 'Full HTTP archive' },
  { id: 'har-sanitized', label: 'Sanitized HAR', hint: 'Tokens, cookies & secrets redacted' },
  { id: 'csv', label: 'CSV', hint: 'One row per request' },
  { id: 'postman', label: 'Postman collection', hint: 'v2.1 — import into Postman' },
  { id: 'cookies-netscape', label: 'Cookies (cookies.txt)', hint: 'Netscape format for curl/wget' },
  { id: 'cookies-json', label: 'Cookies (JSON)', hint: 'Array of cookie objects' },
]

export function exportEntries(format: ExportFormat, entries: readonly Entry[], label: string): void {
  if (!entries.length) {
    toast.error('Nothing to export', { description: 'No requests match the current filters.' })
    return
  }
  const { log, fileName } = useAppStore.getState()
  const raw = entries.map((e) => e.raw)
  const stem = `${baseName(fileName)}-${label}`

  switch (format) {
    case 'har':
      downloadJson(buildHarDocument(raw, log), `${stem}.har`)
      break
    case 'har-sanitized':
      downloadJson(
        buildHarDocument(sanitizeEntries(raw), log, { name: 'HAR Viewer (sanitized)', version: '2.0' }),
        `${stem}.sanitized.har`,
      )
      break
    case 'csv':
      downloadText(toCsv(entries), `${stem}.csv`, 'text/csv')
      break
    case 'postman':
      downloadText(
        toPostmanCollection(raw, `${baseName(fileName)} (${label})`),
        `${stem}.postman.json`,
        'application/json',
      )
      break
    case 'cookies-netscape':
      downloadText(toNetscapeCookies(raw), `${stem}.cookies.txt`)
      break
    case 'cookies-json':
      downloadText(toCookieJson(raw), `${stem}.cookies.json`, 'application/json')
      break
  }
  toast.success(`Exported ${pluralize(entries.length, 'request')}`)
}

/** Bulk actions target ticked rows when there are any, otherwise everything visible. */
export function exportTarget(): { entries: Entry[]; label: 'selected' | 'filtered' } {
  const state = useAppStore.getState()
  if (state.checkedIds.length) {
    const checked = new Set(state.checkedIds)
    return { entries: state.entries.filter((e) => checked.has(e.id)), label: 'selected' }
  }
  return { entries: selectVisibleEntries(state), label: 'filtered' }
}
