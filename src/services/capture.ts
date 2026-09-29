import { toast } from 'sonner'
import { mergeLogs } from '@/har/export/har'
import { toEntries, withEntries } from '@/har/parse'
import type { HarLog } from '@/har/types'
import { baseName } from '@/lib/download'
import { formatBytes, pluralize } from '@/lib/format'
import { useAppStore } from '@/store'
import { parseHarFile } from './parser'
import { clearSession, readSession, writeSession } from './session'
import { applyCriteriaFromHash } from './url-state'

const store = () => useAppStore.getState()
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error))

async function parseWithProgress(file: File): Promise<HarLog> {
  const detail = formatBytes(file.size)
  store().setLoading({ label: `Reading ${file.name}`, detail, progress: 0 })
  const log = await parseHarFile(file, ({ stage, progress }) =>
    store().setLoading({
      label: stage === 'reading' ? `Reading ${file.name}` : 'Parsing JSON',
      detail,
      progress,
    }),
  )
  store().setLoading({
    label: `Indexing ${pluralize(log.entries.length, 'request')}`,
    detail,
    progress: null,
  })
  await nextFrame()
  return log
}

/** Commits the current capture (including deletions) so a reload restores it. */
export async function persistSession({ notify = false } = {}): Promise<void> {
  const { log, entries, fileName, markSaved } = store()
  if (!log) return
  await writeSession({
    fileName,
    log: withEntries(log, entries),
    ids: entries.map((e) => e.id),
    savedAt: Date.now(),
  })
  markSaved()
  if (notify) toast.success('Session saved', { description: 'Deletions are kept across reloads.' })
}

/** First capture of the visit keeps filters from a shared link; later opens start clean. */
function open(log: HarLog, fileName: string) {
  const firstCapture = store().log === null
  store().openCapture({ log, fileName })
  if (firstCapture) applyCriteriaFromHash()
}

export async function openFile(file: File): Promise<void> {
  try {
    const log = await parseWithProgress(file)
    open(log, file.name)
    await persistSession()
  } catch (error) {
    store().setLoading(null)
    toast.error(`Couldn’t open ${file.name}`, { description: messageOf(error) })
  }
}

export async function openSample(): Promise<void> {
  const { createSampleLog } = await import('@/har/sample')
  open(createSampleLog(), 'sample-shop.har')
  await persistSession()
}

/** One file opens; several are merged into a single chronological capture. */
export async function openFiles(files: readonly File[]): Promise<void> {
  const [first, ...rest] = files
  if (!first) return
  await openFile(first)
  for (const file of rest) await mergeFile(file)
}

export async function mergeFile(file: File): Promise<void> {
  const { log, entries, fileName } = store()
  if (!log) return openFile(file)
  try {
    const incoming = await parseWithProgress(file)
    const merged = mergeLogs([withEntries(log, entries), incoming])
    store().openCapture({ log: merged, fileName: `${baseName(fileName)} + ${file.name}` })
    await persistSession()
    toast.success(`Merged ${pluralize(incoming.entries.length, 'request')} from ${file.name}`)
  } catch (error) {
    store().setLoading(null)
    toast.error(`Couldn’t merge ${file.name}`, { description: messageOf(error) })
  }
}

export async function loadComparison(file: File): Promise<void> {
  try {
    const log = await parseHarFile(file)
    store().setComparison({ fileName: file.name, entries: toEntries(log) })
    store().setView('compare')
  } catch (error) {
    toast.error(`Couldn’t load ${file.name}`, { description: messageOf(error) })
  }
}

export async function closeCapture(): Promise<void> {
  store().closeCapture()
  await clearSession()
}

/** Restores the last session from IndexedDB; persisted UI state (filters, pins, notes) is kept. */
export async function restoreSession(): Promise<void> {
  const session = await readSession()
  if (session) {
    store().openCapture({ log: session.log, fileName: session.fileName, ids: session.ids, restore: true })
  } else if (store().fileName) {
    store().closeCapture()
  }
}
