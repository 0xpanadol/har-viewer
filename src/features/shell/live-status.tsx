import { Badge } from '@/components/ui/badge'
import { connectStream, streamConfig } from '@/services/stream'
import { useAppStore } from '@/store'

export function LiveStatus() {
  const live = useAppStore((s) => s.live)
  if (!streamConfig() || !live) return null

  if (live.status === 'open') {
    return (
      <Badge tone="success">
        <span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden />
        Live
      </Badge>
    )
  }

  if (live.status === 'connecting') {
    return <Badge tone="neutral">Connecting…</Badge>
  }

  return (
    <Badge tone="warning">
      Offline
      <button
        type="button"
        onClick={() => connectStream()}
        className="ml-0.5 underline underline-offset-2 hover:opacity-80"
      >
        Reconnect
      </button>
    </Badge>
  )
}
