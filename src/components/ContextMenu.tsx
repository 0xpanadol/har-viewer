import { useEffect, useCallback } from 'react'
import type { ParsedEntry } from '../utils/types'
import { useHarStore } from '../store/harStore'
import { exportHarEntries, buildCurl, buildFetch, buildAxios, exportCookiesNetscape, exportCookiesJson, buildCookieHeader } from '../utils/exporters'

interface Props {
  x: number
  y: number
  entry: ParsedEntry
  onClose: () => void
}

export function ContextMenu({ x, y, entry, onClose }: Props) {
  const checkedEntries = useHarStore((s) => s.checkedEntries)
  const allEntries = useHarStore((s) => s.allEntries)
  const harData = useHarStore((s) => s.harData)
  const toggleCheck = useHarStore((s) => s.toggleCheck)
  const togglePin = useHarStore((s) => s.togglePin)
  const pinnedEntries = useHarStore((s) => s.pinnedEntries)
  const setDiffEntries = useHarStore((s) => s.setDiffEntries)
  const setOverlayPanel = useHarStore((s) => s.setOverlayPanel)
  const selectedIdx = useHarStore((s) => s.selectedIdx)

  const handleClick = useCallback(
    (action: () => void) => {
      onClose()
      action()
    },
    [onClose]
  )

  useEffect(() => {
    const handler = () => onClose()
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [onClose])

  const left = Math.min(x, window.innerWidth - 240)
  const top = Math.min(y, window.innerHeight - 400)
  const isPinned = pinnedEntries.includes(entry._idx)
  const canDiff = selectedIdx >= 0 && selectedIdx !== entry._idx

  const items: Array<{ label: string; action: () => void; disabled?: boolean } | 'sep'> = [
    {
      label: 'Export this request as HAR',
      action: () => exportHarEntries([entry._raw], 'single', harData),
    },
    {
      label: 'Copy URL',
      action: () => navigator.clipboard.writeText(entry.url),
    },
    {
      label: 'Copy as cURL',
      action: () => navigator.clipboard.writeText(buildCurl(entry._raw)),
    },
    {
      label: 'Copy as fetch()',
      action: () => navigator.clipboard.writeText(buildFetch(entry._raw)),
    },
    {
      label: 'Copy as axios',
      action: () => navigator.clipboard.writeText(buildAxios(entry._raw)),
    },
    'sep',
    {
      label: 'Copy cookies (header)',
      action: () => navigator.clipboard.writeText(buildCookieHeader([entry._raw])),
    },
    {
      label: 'Export cookies (Netscape txt)',
      action: () => exportCookiesNetscape([entry._raw], 'single'),
    },
    {
      label: 'Export cookies (JSON)',
      action: () => exportCookiesJson([entry._raw], 'single'),
    },
    'sep',
    {
      label: isPinned ? '★ Unpin this request' : '☆ Pin this request',
      action: () => togglePin(entry._idx),
    },
    {
      label: 'Select this request',
      action: () => toggleCheck(entry._idx),
    },
    {
      label: canDiff ? `Diff with selected (#${selectedIdx + 1})` : 'Diff (select another first)',
      action: () => {
        if (canDiff) {
          setDiffEntries([selectedIdx, entry._idx])
          setOverlayPanel('diff')
        }
      },
      disabled: !canDiff,
    },
    {
      label: checkedEntries.length > 0 ? `Export ${checkedEntries.length} selected as HAR` : 'No selection to export',
      action: () => {
        if (checkedEntries.length) {
          const raw = allEntries.filter((e) => checkedEntries.includes(e._idx)).map((e) => e._raw)
          exportHarEntries(raw, 'selected', harData)
        }
      },
      disabled: checkedEntries.length === 0,
    },
    'sep',
    {
      label: 'Copy response body',
      action: () => {
        const t = entry._raw.response?.content?.text
        if (t) navigator.clipboard.writeText(t)
      },
    },
    {
      label: 'Copy request headers',
      action: () => {
        const h = (entry._raw.request?.headers || []).map((h) => `${h.name}: ${h.value}`).join('\n')
        navigator.clipboard.writeText(h)
      },
    },
    'sep',
    {
      label: 'Replay request (fetch)',
      action: () => replayRequest(entry),
    },
  ]

  return (
    <div className="ctx-menu" style={{ left, top }} onClick={(e) => e.stopPropagation()}>
      {items.map((item, i) => {
        if (item === 'sep') return <div key={i} className="ctx-sep" />
        return (
          <button
            key={i}
            onClick={() => handleClick(item.action)}
            style={item.disabled ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

async function replayRequest(entry: ParsedEntry) {
  const raw = entry._raw
  const url = raw.request?.url || ''
  const method = raw.request?.method || 'GET'
  const headers: Record<string, string> = {}
  ;(raw.request?.headers || []).forEach((h) => {
    const n = h.name.toLowerCase()
    if (['host', 'content-length', 'connection', 'accept-encoding'].includes(n)) return
    headers[h.name] = h.value
  })

  try {
    const opts: RequestInit = { method, headers, mode: 'cors' }
    if (raw.request?.postData?.text && method !== 'GET' && method !== 'HEAD') {
      opts.body = raw.request.postData.text
    }
    const resp = await fetch(url, opts)
    const body = await resp.text()
    const resultWindow = window.open('', '_blank')
    if (resultWindow) {
      resultWindow.document.title = `Replay: ${method} ${url}`
      resultWindow.document.body.style.cssText = 'background:#111;color:#eee;font-family:monospace;padding:20px;white-space:pre-wrap;word-break:break-all'
      resultWindow.document.body.textContent = `Status: ${resp.status} ${resp.statusText}\n\n--- Headers ---\n${[...resp.headers.entries()].map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n--- Body ---\n${body.slice(0, 50000)}`
    }
  } catch (err) {
    alert(`Replay failed: ${err instanceof Error ? err.message : String(err)}\n\nThis is expected for cross-origin requests or requests requiring auth.`)
  }
}
