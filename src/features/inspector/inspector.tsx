import { MousePointerClick } from 'lucide-react'
import { useRef, useState, type ComponentType } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { FindQueryContext, MIN_QUERY } from '@/components/find-query'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { InspectorTab } from '@/har/search'
import type { Entry } from '@/har/types'
import { useAppStore } from '@/store'
import { useSelectedEntry } from '@/store/selectors'
import { FindBar } from './find-bar'
import { InspectorHeader } from './inspector-header'
import { inspectorTabs } from './inspector-tabs'
import { CookiesTab } from './tabs/cookies-tab'
import { HeadersTab } from './tabs/headers-tab'
import { PayloadTab } from './tabs/payload-tab'
import { RawTab } from './tabs/raw-tab'
import { ResponseTab } from './tabs/response-tab'
import { TimingTab } from './tabs/timing-tab'
import { WebSocketTab } from './tabs/websocket-tab'
import { useFindNavigation } from './use-find-navigation'

const TAB_CONTENT: Record<InspectorTab, ComponentType<{ entry: Entry }>> = {
  headers: HeadersTab,
  payload: PayloadTab,
  response: ResponseTab,
  cookies: CookiesTab,
  timing: TimingTab,
  websocket: WebSocketTab,
  raw: RawTab,
}

/** Tabs whose content manages its own scrolling (toolbars stay pinned). */
const SELF_SCROLLING = new Set<InspectorTab>(['response'])

function InspectorPanel({ entry }: { entry: Entry }) {
  const tab = useAppStore((s) => s.inspectorTab)
  const setTab = useAppStore((s) => s.setInspectorTab)
  // Carry a plain-text request search into the inspector so matches are highlighted immediately.
  const [query, setQuery] = useState(() => {
    const { query: global, useRegex } = useAppStore.getState()
    return global.length >= MIN_QUERY && !useRegex ? global : ''
  })

  const tabs = inspectorTabs(entry)
  const active = tabs.some((t) => t.id === tab) ? tab : 'headers'
  const panelRef = useRef<HTMLDivElement>(null)
  const { count, index, next, previous } = useFindNavigation(panelRef, query, active)
  const Content = TAB_CONTENT[active]

  return (
    <div className="flex h-full min-h-0 flex-col bg-panel">
      <InspectorHeader entry={entry} />
      <Tabs value={active} onValueChange={(v) => setTab(v as InspectorTab)}>
        <TabsList className="border-b px-4" aria-label="Request details">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
              {t.count !== undefined && (
                <span className="text-xs font-normal text-subtle-foreground tabular">{t.count}</span>
              )}
              {t.dot && <span className="size-1.5 rounded-full bg-primary/70" aria-label="has content" />}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <FindBar
        query={query}
        onQueryChange={setQuery}
        count={count}
        index={index}
        onNext={next}
        onPrevious={previous}
      />
      <div
        ref={panelRef}
        role="tabpanel"
        aria-label={active}
        className={
          SELF_SCROLLING.has(active) ? 'min-h-0 flex-1 overflow-hidden' : 'min-h-0 flex-1 overflow-y-auto'
        }
      >
        <FindQueryContext value={query}>
          <ErrorBoundary key={active} label="This tab">
            <Content entry={entry} />
          </ErrorBoundary>
        </FindQueryContext>
      </div>
    </div>
  )
}

export function Inspector() {
  const entry = useSelectedEntry()
  if (!entry) {
    return (
      <div className="flex h-full items-center bg-panel">
        <EmptyState
          icon={<MousePointerClick />}
          title="No request selected"
          description="Choose a request to inspect its headers, payload, response and timing."
        />
      </div>
    )
  }
  return <InspectorPanel key={entry.id} entry={entry} />
}
