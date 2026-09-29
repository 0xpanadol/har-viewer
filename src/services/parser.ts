import type { HarLog } from '@/har/types'
import type { ParserRequest, ParserResponse } from '@/workers/har-parser.worker'

export interface ParseProgress {
  stage: 'reading' | 'parsing'
  progress: number | null
}

/** Reads and parses a HAR file off the main thread so the UI stays responsive on huge captures. */
export function parseHarFile(file: File, onProgress?: (p: ParseProgress) => void): Promise<HarLog> {
  const worker = new Worker(new URL('../workers/har-parser.worker.ts', import.meta.url), { type: 'module' })
  return new Promise<HarLog>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<ParserResponse>) => {
      const message = event.data
      if (message.type === 'progress') onProgress?.({ stage: message.stage, progress: message.progress })
      else if (message.type === 'done') resolve(message.log)
      else reject(new Error(message.message))
    }
    worker.onerror = (event) => reject(new Error(event.message || 'The parser worker crashed'))
    worker.postMessage({ file } satisfies ParserRequest)
  }).finally(() => worker.terminate())
}
