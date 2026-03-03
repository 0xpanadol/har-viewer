import { useMemo } from 'react'
import { useHarStore } from '../store/harStore'
import { formatBytes, formatTime } from '../utils/formatters'

export function SummaryBar() {
  const allEntries = useHarStore((s) => s.allEntries)
  const harData = useHarStore((s) => s.harData)
  const waterfallStart = useHarStore((s) => s.waterfallStart)
  const waterfallEnd = useHarStore((s) => s.waterfallEnd)

  const { totalSize, domains, dcl, load } = useMemo(() => {
    const totalSize = allEntries.reduce((s, e) => s + Math.max(0, e.size), 0)
    const domains = new Set(allEntries.map((e) => e.host)).size
    const pages = harData?.pages || []
    const pt = pages.length ? pages[0].pageTimings : null
    return {
      totalSize,
      domains,
      dcl: pt?.onContentLoad && pt.onContentLoad > 0 ? formatTime(pt.onContentLoad) : '—',
      load: pt?.onLoad && pt.onLoad > 0 ? formatTime(pt.onLoad) : '—',
    }
  }, [allEntries, harData])

  return (
    <div id="summary-bar" className="visible">
      <div className="sum-item">Requests: <b>{allEntries.length}</b></div>
      <div className="sum-item">Transferred: <b>{formatBytes(totalSize)}</b></div>
      <div className="sum-item">Finish: <b>{formatTime(waterfallEnd - waterfallStart)}</b></div>
      <div className="sum-item">DOMContentLoaded: <b>{dcl}</b></div>
      <div className="sum-item">Load: <b>{load}</b></div>
      <div className="sum-item">Domains: <b>{domains}</b></div>
    </div>
  )
}
