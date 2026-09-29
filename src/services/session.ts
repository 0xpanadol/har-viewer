import { createStore, del, get, set } from 'idb-keyval'
import type { HarLog } from '@/har/types'

/** Capture payloads are too large for localStorage, so the session lives in IndexedDB. */
const store = createStore('har-viewer', 'session')
const KEY = 'current'

export interface StoredSession {
  fileName: string
  log: HarLog
  /** Stable entry ids, aligned with log.entries, so pins/notes survive deletions + reloads. */
  ids: number[]
  savedAt: number
}

export async function writeSession(session: StoredSession): Promise<void> {
  try {
    await set(KEY, session, store)
  } catch (error) {
    console.warn('Could not persist session to IndexedDB', error)
  }
}

export async function readSession(): Promise<StoredSession | null> {
  try {
    const value = await get<StoredSession>(KEY, store)
    return value && Array.isArray(value.log?.entries) ? value : null
  } catch (error) {
    console.warn('Could not read session from IndexedDB', error)
    return null
  }
}

export async function clearSession(): Promise<void> {
  try {
    await del(KEY, store)
  } catch (error) {
    console.warn('Could not clear session', error)
  }
}
