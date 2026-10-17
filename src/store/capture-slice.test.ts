import { describe, expect, it } from 'vitest'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { harEntry } from '@/har/test-utils'
import { createCaptureSlice } from './capture-slice'
import { createFilterSlice } from './filter-slice'
import { createSelectionSlice } from './selection-slice'
import type { AppState } from './types'
import { createUiSlice } from './ui-slice'

function createMemoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
    removeItem: (key: string) => {
      map.delete(key)
    },
  }
}

function createTestStore() {
  return create<AppState>()(
    persist(
      (...a) => ({
        ...createCaptureSlice(...a),
        ...createFilterSlice(...a),
        ...createSelectionSlice(...a),
        ...createUiSlice(...a),
      }),
      {
        name: 'test-store',
        storage: createJSONStorage(createMemoryStorage),
      },
    ),
  )
}

describe('capture-slice live entry upserts', () => {
  it('preserves existing _webSocketMessages when updated entry omits them', () => {
    const useTestStore = createTestStore()

    const store = useTestStore.getState()
    store.openLive({ label: 'Live Test', creator: { name: 'test', version: '1.0' } })

    const raw1 = harEntry({ url: 'https://example.com/ws' })
    store.upsertLiveEntries([{ id: 1, entry: raw1 }])

    const wsMsg = { type: 'receive' as const, time: 100, opcode: 1, data: 'hello' }
    store.appendLiveWsMessages(1, [wsMsg])

    expect(useTestStore.getState().entries[0]?.raw._webSocketMessages).toEqual([wsMsg])

    // Incoming update without _webSocketMessages field
    const raw2 = harEntry({ url: 'https://example.com/ws', status: 200 })
    store.upsertLiveEntries([{ id: 1, entry: raw2 }])

    const updated = useTestStore.getState().entries[0]
    expect(updated?.raw._webSocketMessages).toEqual([wsMsg])
    expect(updated?.status).toBe(200)

    store.closeCapture()
  })
})
