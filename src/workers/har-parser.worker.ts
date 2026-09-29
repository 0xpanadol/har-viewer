import { HarParseError, normalizeLog } from '@/har/parse'
import type { HarLog } from '@/har/types'

export type ParserRequest = { file: File }

export type ParserResponse =
  | { type: 'progress'; stage: 'reading' | 'parsing'; progress: number | null }
  | { type: 'done'; log: HarLog }
  | { type: 'error'; message: string }

// The app compiles against the DOM lib; the WebWorker lib conflicts with it, so the
// worker scope is typed to exactly what this module uses (module scope shadows the global).
interface ParserScope {
  postMessage(message: ParserResponse): void
  onmessage: ((event: MessageEvent<ParserRequest>) => void) | null
}
declare const self: ParserScope

const post = (message: ParserResponse) => self.postMessage(message)

async function readWithProgress(file: File): Promise<string> {
  const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader()
  const chunks: string[] = []
  let loaded = 0
  let lastReported = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.length
    const progress = file.size ? Math.min(1, loaded / file.size) : null
    if (progress === null || progress - lastReported > 0.02) {
      lastReported = progress ?? 0
      post({ type: 'progress', stage: 'reading', progress })
    }
  }
  return chunks.join('')
}

self.onmessage = async (event: MessageEvent<ParserRequest>) => {
  try {
    const text = await readWithProgress(event.data.file)
    post({ type: 'progress', stage: 'parsing', progress: null })
    const log = normalizeLog(JSON.parse(text))
    post({ type: 'done', log })
  } catch (error) {
    const message =
      error instanceof HarParseError
        ? error.message
        : error instanceof SyntaxError
          ? `Invalid JSON — ${error.message}`
          : error instanceof Error
            ? error.message
            : String(error)
    post({ type: 'error', message })
  }
}
