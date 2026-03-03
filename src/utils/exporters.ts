import type { HarEntry, HarLog } from './types'

export function exportHarEntries(
  rawEntries: HarEntry[],
  label: string,
  harData: HarLog | null
): void {
  const exportData = {
    log: {
      version: harData?.version || '1.2',
      creator: harData?.creator || { name: 'HAR Viewer Export', version: '1.0' },
      pages: harData?.pages || [],
      entries: rawEntries,
    },
  }
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `har-export-${rawEntries.length}-${label}.har`
  a.click()
  URL.revokeObjectURL(url)
}

export function buildCurl(raw: HarEntry): string {
  let cmd = `curl '${raw.request?.url || ''}'`
    ; (raw.request?.headers || []).forEach((h) => {
      if (h.name.toLowerCase() !== 'cookie') cmd += ` \\\n  -H '${h.name}: ${h.value}'`
    })
  const cookies = (raw.request?.cookies || []).map((c) => `${c.name}=${c.value}`).join('; ')
  if (cookies) cmd += ` \\\n  -H 'Cookie: ${cookies}'`
  if (raw.request?.method && raw.request.method !== 'GET')
    cmd += ` \\\n  -X ${raw.request.method}`
  if (raw.request?.postData?.text)
    cmd += ` \\\n  --data-raw '${raw.request.postData.text.replace(/'/g, "'\\''")}'`
  return cmd
}
