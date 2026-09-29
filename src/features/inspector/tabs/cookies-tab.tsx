import { Cookie } from 'lucide-react'
import { CopyButton } from '@/components/copy-button'
import { Highlight } from '@/components/highlight'
import { useFindFilter } from '@/components/find-query'
import { KeyValueList } from '@/components/key-value-list'
import { Section } from '@/components/section'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { Entry, HarCookie } from '@/har/types'
import { copyCookieHeader } from '@/services/entry-actions'
import { exportEntries } from '@/services/export'

function attributes(c: HarCookie): string[] {
  return [
    c.httpOnly && 'HttpOnly',
    c.secure && 'Secure',
    c.sameSite && `SameSite=${c.sameSite}`,
    c.path && `Path=${c.path}`,
    c.domain && `Domain=${c.domain}`,
    c.expires && `Expires ${new Date(c.expires).toLocaleString()}`,
  ].filter((a): a is string => Boolean(a))
}

function SetCookieList({ cookies }: { cookies: HarCookie[] }) {
  const rows = useFindFilter(cookies)
  if (!rows.length) return <p className="px-3 text-xs text-subtle-foreground">No matches</p>
  return (
    <ul className="flex flex-col">
      {rows.map((c, i) => (
        <li key={`${c.name}-${i}`} className="group/row px-3 py-1.5 font-mono text-xs hover:bg-muted/60">
          <div className="flex items-start gap-3">
            <span className="w-[34%] shrink-0 truncate text-muted-foreground" title={c.name}>
              <Highlight text={c.name} />
            </span>
            <span className="min-w-0 flex-1 break-all">
              <Highlight text={c.value} />
            </span>
            <CopyButton
              value={c.value}
              className="-my-0.5 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
            />
          </div>
          {attributes(c).length > 0 && (
            <div className="mt-1 ml-[calc(34%+0.75rem)] flex flex-wrap gap-1">
              {attributes(c).map((a) => (
                <Badge key={a} tone="neutral" className="font-sans">
                  {a}
                </Badge>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

export function CookiesTab({ entry }: { entry: Entry }) {
  const requestCookies = entry.raw.request?.cookies ?? []
  const responseCookies = entry.raw.response?.cookies ?? []
  if (!requestCookies.length && !responseCookies.length) {
    return (
      <EmptyState
        icon={<Cookie />}
        title="No cookies"
        description="Nothing was sent or set via cookies on this request."
      />
    )
  }

  const label = `request-${entry.id + 1}`
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
        <Button size="xs" onClick={() => copyCookieHeader([entry])} disabled={!requestCookies.length}>
          Copy as Cookie header
        </Button>
        <Button size="xs" onClick={() => exportEntries('cookies-netscape', [entry], label)}>
          Export cookies.txt
        </Button>
        <Button size="xs" onClick={() => exportEntries('cookies-json', [entry], label)}>
          Export JSON
        </Button>
      </div>
      {requestCookies.length > 0 && (
        <Section title="Request cookies" count={requestCookies.length}>
          <KeyValueList items={requestCookies} decode />
        </Section>
      )}
      {responseCookies.length > 0 && (
        <Section title="Set by response" count={responseCookies.length}>
          <SetCookieList cookies={responseCookies} />
        </Section>
      )}
    </>
  )
}
