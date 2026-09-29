import { toast } from 'sonner'
import { responseText } from '@/har/decode'
import type { SnippetFormat } from '@/har/export/snippets'
import { toCookieHeader } from '@/har/export/tabular'
import type { Entry } from '@/har/types'
import { copyText } from '@/lib/clipboard'
import { pluralize } from '@/lib/format'
import { useAppStore } from '@/store'
import { selectVisibleEntries } from '@/store/selectors'

export const copyUrl = (entry: Entry) => copyText(entry.url, 'URL copied')

export const copySnippet = (entry: Entry, format: SnippetFormat) =>
  copyText(format.build(entry.raw), `Copied as ${format.label}`)

export function copyResponseBody(entry: Entry) {
  const body = responseText(entry.raw.response?.content)
  if (!body) return toast.error('This response has no captured body')
  return copyText(body, 'Response body copied')
}

export const copyRequestHeaders = (entry: Entry) =>
  copyText(
    (entry.raw.request?.headers ?? []).map((h) => `${h.name}: ${h.value}`).join('\n'),
    'Request headers copied',
  )

export function copyCookieHeader(entries: readonly Entry[]) {
  const header = toCookieHeader(entries.map((e) => e.raw))
  if (!header) return toast.error('No request cookies to copy')
  return copyText(header, 'Cookie header copied')
}

export const copyUrls = (entries: readonly Entry[]) =>
  copyText(entries.map((e) => e.url).join('\n'), `${pluralize(entries.length, 'URL')} copied`)

/** Removes requests and moves the selection to the nearest surviving visible row. Undoable. */
export function deleteEntries(ids: readonly number[]): void {
  if (!ids.length) return
  const state = useAppStore.getState()
  const doomed = new Set(ids)
  const visible = selectVisibleEntries(state)
  let nextSelected: number | null = null
  if (state.selectedId !== null && doomed.has(state.selectedId)) {
    const at = visible.findIndex((e) => e.id === state.selectedId)
    const after = visible.slice(at + 1).find((e) => !doomed.has(e.id))
    const before = visible.slice(0, Math.max(0, at)).findLast((e) => !doomed.has(e.id))
    nextSelected = (after ?? before)?.id ?? null
  }
  state.removeEntries(ids, nextSelected)
  toast(`Deleted ${pluralize(ids.length, 'request')}`, {
    action: { label: 'Undo', onClick: () => undoDelete() },
  })
}

export function undoDelete(): void {
  if (useAppStore.getState().undoRemove()) toast.success('Deletion undone')
}
