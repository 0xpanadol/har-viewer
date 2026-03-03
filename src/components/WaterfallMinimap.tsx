import { useMemo, useCallback } from 'react'
import { useHarStore } from '../store/harStore'
import { useFilteredEntries } from '../hooks/useFilteredEntries'

export function WaterfallMinimap() {
  const waterfallStart = useHarStore((s) => s.waterfallStart)
  const waterfallEnd = useHarStore((s) => s.waterfallEnd)
  const setSelectedIdx = useHarStore((s) => s.setSelectedIdx)
  const setDetailPanelOpen = useHarStore((s) => s.setDetailPanelOpen)
  const filteredEntries = useFilteredEntries()

  const range = waterfallEnd - waterfallStart || 1

  const bars = useMemo(() => {
    return filteredEntries.map((e) => {
      const left = ((e.startTime - waterfallStart) / range) * 100
      const width = Math.max(0.3, (e.time / range) * 100)
      const color = e.status >= 400 ? 'var(--red)' : e.time > 2000 ? 'var(--yellow)' : 'var(--accent)'
      return { idx: e._idx, left, width, color }
    })
  }, [filteredEntries, waterfallStart, range])

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const targetTime = waterfallStart + pct * range
    let closest = filteredEntries[0]
    let minDist = Infinity
    for (const entry of filteredEntries) {
      const dist = Math.abs(entry.startTime - targetTime)
      if (dist < minDist) { minDist = dist; closest = entry }
    }
    if (closest) {
      setSelectedIdx(closest._idx)
      setDetailPanelOpen(true)
    }
  }, [filteredEntries, waterfallStart, range, setSelectedIdx, setDetailPanelOpen])

  if (filteredEntries.length === 0) return null

  return (
    <div className="wf-minimap" onClick={handleClick} title="Click to jump to request">
      {bars.map((b) => (
        <div
          key={b.idx}
          className="wf-mini-bar"
          style={{ left: `${b.left}%`, width: `${b.width}%`, background: b.color }}
        />
      ))}
    </div>
  )
}
