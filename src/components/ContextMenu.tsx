import { useEffect, useCallback } from 'react'
import type { ParsedEntry } from '../utils/types'
import { useHarStore } from '../store/harStore'
import { exportHarEntries, buildCurl } from '../utils/exporters'

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

  const left = Math.min(x, window.innerWidth - 220)
  const top = Math.min(y, window.innerHeight - 260)

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
    'sep',
    {
      label: 'Select this request',
      action: () => toggleCheck(entry._idx),
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
