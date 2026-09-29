import { Copy, ExternalLink, NotebookPen } from 'lucide-react'
import { UrlText } from '@/components/http-labels'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/popover'
import { Tooltip } from '@/components/ui/tooltip'
import type { MatchLocations } from '@/har/search'
import { phaseSegments } from '@/har/timings'
import type { Entry } from '@/har/types'
import { copyText } from '@/lib/clipboard'
import { formatDuration } from '@/lib/format'

const MATCH_BADGES: ReadonlyArray<[keyof MatchLocations, string, string]> = [
  ['headers', 'H', 'Match in headers'],
  ['requestBody', 'Q', 'Match in request body'],
  ['responseBody', 'R', 'Match in response body'],
  ['cookies', 'C', 'Match in cookies'],
]

export function MatchBadges({ locations }: { locations: MatchLocations | null }) {
  if (!locations) return null
  const hits = MATCH_BADGES.filter(([key]) => locations[key])
  if (!hits.length) return null
  return (
    <span className="ml-auto flex shrink-0 gap-0.5 pl-2">
      {hits.map(([key, letter, title]) => (
        <span
          key={key}
          title={title}
          className="grid size-4 place-items-center rounded-[3px] bg-highlight/25 font-mono text-2xs font-semibold text-foreground"
        >
          {letter}
        </span>
      ))}
    </span>
  )
}

function decodeSafe(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function UrlPreview({ entry }: { entry: Entry }) {
  let params: Array<[string, string]> = []
  try {
    params = [...new URL(entry.url).searchParams]
  } catch {
    /* non-URL request line */
  }
  return (
    <div className="flex flex-col gap-2.5">
      <p className="font-mono text-xs break-all">
        <span className="text-subtle-foreground">{entry.host}</span>
        {entry.path.split('?')[0]}
      </p>
      {params.length > 0 && (
        <dl className="grid max-h-48 grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 overflow-y-auto rounded-md bg-muted/60 p-2 font-mono text-xs">
          {params.slice(0, 30).map(([key, value], i) => (
            <div key={i} className="contents">
              <dt className="text-info">{decodeSafe(key)}</dt>
              <dd className="min-w-0 break-all">{decodeSafe(value)}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="flex gap-1.5">
        <Button size="xs" onClick={() => copyText(entry.url, 'URL copied')}>
          <Copy /> Copy URL
        </Button>
        {params.length > 0 && (
          <Button
            size="xs"
            onClick={() =>
              copyText(
                params.map(([k, v]) => `${decodeSafe(k)}=${decodeSafe(v)}`).join('\n'),
                'Parameters copied',
              )
            }
          >
            Copy params
          </Button>
        )}
        <Button size="xs" variant="ghost" asChild>
          <a href={entry.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink /> Open
          </a>
        </Button>
      </div>
    </div>
  )
}

interface NameCellProps {
  entry: Entry
  note?: string
  duplicate: boolean
  preview: boolean
  locations: MatchLocations | null
}

export function NameCell({ entry, note, duplicate, preview, locations }: NameCellProps) {
  const failed = entry.status === 0
  const text = (
    <UrlText
      host={entry.host}
      path={entry.path}
      className={failed ? '[&>span:last-child]:text-danger' : undefined}
    />
  )
  return (
    <div className="flex min-w-0 items-center gap-1.5 px-2">
      {preview ? (
        <HoverCard openDelay={650} closeDelay={80}>
          <HoverCardTrigger asChild>
            <span className="min-w-0 truncate">{text}</span>
          </HoverCardTrigger>
          <HoverCardContent onClick={(e) => e.stopPropagation()}>
            <UrlPreview entry={entry} />
          </HoverCardContent>
        </HoverCard>
      ) : (
        text
      )}
      {duplicate && (
        <Tooltip content="Requested more than once with the same method and URL">
          <span className="shrink-0 rounded-[3px] border px-1 text-2xs text-subtle-foreground">dup</span>
        </Tooltip>
      )}
      {note && (
        <Tooltip content={note} className="whitespace-pre-wrap">
          <NotebookPen className="size-3.5 shrink-0 text-warning" aria-label="Has note" />
        </Tooltip>
      )}
      <MatchBadges locations={locations} />
    </div>
  )
}

/**
 * Compact DevTools-style bar: connection setup (neutral), waiting for the server (light) and
 * download (solid) in one hue. The Waterfall view breaks out every phase with a legend.
 */
export function WaterfallCell({ entry, start, duration }: { entry: Entry; start: number; duration: number }) {
  if (duration <= 0 || entry.time <= 0) return <div className="px-2" />
  const segments = phaseSegments(entry)
  const setup = segments
    .filter((s) => s.key !== 'wait' && s.key !== 'receive')
    .reduce((sum, s) => sum + s.duration, 0)
  const wait = segments.find((s) => s.key === 'wait')?.duration ?? 0
  const receive = segments.find((s) => s.key === 'receive')?.duration ?? 0
  const total = setup + wait + receive || entry.time
  const left = ((entry.startTime - start) / duration) * 100
  const width = Math.max(0.4, (entry.time / duration) * 100)

  return (
    <div
      className="relative h-full px-2"
      title={`Starts +${formatDuration(entry.startTime - start)} · ${formatDuration(entry.time)}`}
    >
      <div className="relative h-full">
        <div
          className="absolute top-1/2 flex h-2 -translate-y-1/2 overflow-hidden rounded-[2px]"
          style={{ left: `${left}%`, width: `${width}%`, minWidth: 2 }}
        >
          <span className="h-full bg-phase-blocked" style={{ width: `${(setup / total) * 100}%` }} />
          <span className="h-full bg-phase-wait/45" style={{ width: `${(wait / total) * 100}%` }} />
          <span className="h-full bg-phase-wait" style={{ width: `${(receive / total) * 100}%` }} />
        </div>
      </div>
    </div>
  )
}
