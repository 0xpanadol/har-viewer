import type { Entry, WebSocketMessage } from '@/har/types'
import { useAppStore } from '@/store'
import type { LiveEntry } from '@/store/capture-slice'
import type { ReplayResult } from './replay'

export interface StreamConfig {
  url: string
  label?: string
}

export interface HostHooks {
  sourceLabel?: string
  onReplay?: (entry: Entry, signal?: AbortSignal) => Promise<ReplayResult>
  onDelete?: (ids: readonly number[]) => void
}

declare global {
  interface Window {
    HAR_VIEWER_STREAM?: StreamConfig
    HAR_VIEWER_HOST?: HostHooks
  }
}

interface PendingReplayEntry {
  resolve: (result: ReplayResult) => void
  reject: (err: Error) => void
  timer: number
  cleanup?: () => void
}

type ServerMessage =
  | { type: 'hello'; creator?: { name: string; version: string }; label?: string }
  | { type: 'snapshot'; entries: LiveEntry[] }
  | { type: 'entries/add'; entries: LiveEntry[] }
  | { type: 'entries/update'; entries: LiveEntry[] }
  | { type: 'entries/remove'; ids: number[] }
  | { type: 'ws/messages'; id: number; messages: WebSocketMessage[] }
  | {
      type: 'replay/result'
      requestId: string
      status: number
      statusText: string
      headers: Array<[string, string]>
      body: string
      bodyTruncated?: boolean
      durationMs: number
    }
  | { type: 'replay/error'; requestId: string; message: string }

let socket: WebSocket | null = null
let retryTimer: number | null = null
let attempt = 0
let intentionalClose = false
let frame: number | null = null
let queue: LiveEntry[] = []
const pendingReplays = new Map<string, PendingReplayEntry>()

export function streamConfig(): StreamConfig | null {
  if (typeof window !== 'undefined' && window.HAR_VIEWER_STREAM) {
    return window.HAR_VIEWER_STREAM
  }
  const envUrl = import.meta.env.VITE_HAR_VIEWER_STREAM as string | undefined
  return envUrl ? { url: envUrl } : null
}

export function hostHooks(): HostHooks | undefined {
  return typeof window !== 'undefined' ? window.HAR_VIEWER_HOST : undefined
}

export function defaultStreamLabel(): string {
  return hostHooks()?.sourceLabel || streamConfig()?.label || 'Live stream'
}

export function isStreamConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN && useAppStore.getState().source === 'live'
}

function flushQueue(): void {
  frame = null
  if (queue.length === 0) return
  useAppStore.getState().upsertLiveEntries(queue.splice(0, queue.length))
}

function scheduleFlush(): void {
  if (frame !== null) return
  frame = requestAnimationFrame(flushQueue)
}

function clearQueue(): void {
  if (frame !== null) {
    cancelAnimationFrame(frame)
    frame = null
  }
  queue.length = 0
}

function rejectAllReplays(reason: string): void {
  for (const [, pending] of pendingReplays) {
    clearTimeout(pending.timer)
    pending.cleanup?.()
    pending.reject(new Error(reason))
  }
  pendingReplays.clear()
}

function handle(msg: ServerMessage): void {
  const store = useAppStore.getState()
  switch (msg.type) {
    case 'hello':
      store.openLive({ label: msg.label || defaultStreamLabel(), creator: msg.creator })
      break
    case 'snapshot':
      clearQueue()
      store.snapshotLive(msg.entries)
      break
    case 'entries/add':
    case 'entries/update':
      queue.push(...msg.entries)
      scheduleFlush()
      break
    case 'entries/remove': {
      const doomed = new Set(msg.ids)
      queue = queue.filter((item) => !doomed.has(item.id))
      store.removeLiveEntries(msg.ids)
      break
    }
    case 'ws/messages':
      if (frame !== null) flushQueue()
      store.appendLiveWsMessages(msg.id, msg.messages)
      break
    case 'replay/result':
    case 'replay/error': {
      const pending = pendingReplays.get(msg.requestId)
      if (!pending) break
      pendingReplays.delete(msg.requestId)
      clearTimeout(pending.timer)
      pending.cleanup?.()
      if (msg.type === 'replay/error') {
        pending.reject(new Error(msg.message || 'Replay failed'))
      } else {
        const body = msg.bodyTruncated ? `${msg.body}\n\n… truncated` : msg.body
        pending.resolve({
          status: msg.status,
          statusText: msg.statusText,
          headers: msg.headers,
          body,
          durationMs: msg.durationMs,
        })
      }
      break
    }
  }
}

export function connectStream(): void {
  const cfg = streamConfig()
  if (!cfg) return
  if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
    return
  }
  if (retryTimer !== null) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  intentionalClose = false
  const prevLabel = useAppStore.getState().live?.label ?? defaultStreamLabel()
  useAppStore.getState().setLive({ status: 'connecting', label: prevLabel })

  let wsUrl = cfg.url
  if (!wsUrl.startsWith('ws:') && !wsUrl.startsWith('wss:')) {
    const resolved = new URL(wsUrl, window.location.href)
    resolved.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    wsUrl = resolved.toString()
  }

  const ws = new WebSocket(wsUrl)
  socket = ws

  ws.onopen = () => {
    if (socket !== ws) return
    attempt = 0
  }

  ws.onmessage = (event) => {
    if (socket !== ws) return
    try {
      const parsed = JSON.parse(String(event.data)) as ServerMessage
      handle(parsed)
    } catch {
      /* ignore malformed frame */
    }
  }

  ws.onclose = () => {
    if (socket !== ws) return
    socket = null
    clearQueue()
    rejectAllReplays('Live connection closed')
    const currentLabel = useAppStore.getState().live?.label ?? defaultStreamLabel()
    if (intentionalClose || useAppStore.getState().source !== 'live') {
      useAppStore.getState().setLive({ status: 'closed', label: currentLabel })
      return
    }
    useAppStore.getState().setLive({ status: 'connecting', label: currentLabel })
    const delay = Math.min(1000 * 2 ** attempt, 10000)
    attempt += 1
    retryTimer = window.setTimeout(() => {
      retryTimer = null
      connectStream()
    }, delay)
  }

  ws.onerror = () => {
    /* a close event follows */
  }
}

export function disconnectStream(): void {
  intentionalClose = true
  if (retryTimer !== null) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  clearQueue()
  rejectAllReplays('Disconnected')
  if (socket) {
    const ws = socket
    socket = null
    try {
      ws.close()
    } catch {
      /* ignore */
    }
  }
  const current = useAppStore.getState().live
  if (current) {
    useAppStore.getState().setLive({ status: 'closed', label: current.label })
  }
}

export function streamReplay(id: number, signal?: AbortSignal): Promise<ReplayResult> {
  if (!isStreamConnected() || !socket) {
    return Promise.reject(new Error('Not connected to live stream'))
  }
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'))
  }
  const ws = socket
  const requestId = crypto.randomUUID()
  return new Promise<ReplayResult>((resolve, reject) => {
    const onAbort = () => {
      const pending = pendingReplays.get(requestId)
      if (!pending) return
      pendingReplays.delete(requestId)
      clearTimeout(pending.timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timer = window.setTimeout(() => {
      pendingReplays.delete(requestId)
      signal?.removeEventListener('abort', onAbort)
      reject(new Error('Replay timed out after 60s'))
    }, 60_000)

    const cleanup = signal ? () => signal.removeEventListener('abort', onAbort) : undefined
    signal?.addEventListener('abort', onAbort, { once: true })

    pendingReplays.set(requestId, { resolve, reject, timer, cleanup })
    ws.send(JSON.stringify({ type: 'replay', id, requestId }))
  })
}

export function streamDelete(ids: readonly number[]): void {
  if (ids.length === 0) return
  useAppStore.getState().removeLiveEntries(ids)
  if (!socket || socket.readyState !== WebSocket.OPEN) return
  for (const id of ids) {
    socket.send(JSON.stringify({ type: 'delete', id }))
  }
}
