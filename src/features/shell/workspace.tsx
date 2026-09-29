import { LoaderCircle } from 'lucide-react'
import { Dialog as DialogPrimitive, VisuallyHidden } from 'radix-ui'
import { lazy, Suspense, type ComponentType } from 'react'
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels'
import { ErrorBoundary } from '@/components/error-boundary'
import { SheetContent } from '@/components/ui/dialog'
import { useIsDesktop } from '@/hooks/use-media-query'
import { useAppStore } from '@/store'
import type { ViewId } from '@/store/ui-slice'
import { FilterSidebar } from '../filters/filter-sidebar'
import { Inspector } from '../inspector/inspector'
import { RequestsView } from '../requests/requests-view'
import { viewById } from './views'

const named = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(async () => ({ default: (await load())[name] }))

/** The request list ships in the main bundle; secondary views load on first visit. */
const VIEW_COMPONENTS: Record<ViewId, ComponentType> = {
  requests: RequestsView,
  waterfall: named(() => import('../waterfall/waterfall-view'), 'WaterfallView'),
  timeline: named(() => import('../timeline/timeline-view'), 'TimelineView'),
  overview: named(() => import('../overview/overview-view'), 'OverviewView'),
  issues: named(() => import('../issues/issues-view'), 'IssuesView'),
  initiators: named(() => import('../initiators/initiators-view'), 'InitiatorsView'),
  compare: named(() => import('../compare/compare-view'), 'CompareView'),
}

function ViewFallback() {
  return (
    <div className="grid h-full place-items-center">
      <LoaderCircle className="size-5 animate-spin text-subtle-foreground" aria-label="Loading view" />
    </div>
  )
}

function ActiveView() {
  const view = useAppStore((s) => s.view)
  const View = VIEW_COMPONENTS[view]
  return (
    <ErrorBoundary key={view} label={viewById(view).label}>
      <Suspense fallback={<ViewFallback />}>
        <View />
      </Suspense>
    </ErrorBoundary>
  )
}

/** Desktop: persistent sidebar + resizable inspector split (layout remembered). */
function DesktopWorkspace({ filtered }: { filtered: boolean }) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const inspectorOpen = useAppStore((s) => s.inspectorOpen && s.selectedId !== null)
  const layout = useDefaultLayout({
    id: 'har-viewer:workspace',
    panelIds: inspectorOpen ? ['view', 'inspector'] : ['view'],
    storage: localStorage,
  })

  return (
    <div className="flex min-h-0 flex-1">
      {filtered && sidebarOpen && <FilterSidebar />}
      <Group
        orientation="horizontal"
        className="min-w-0 flex-1"
        defaultLayout={layout.defaultLayout}
        onLayoutChanged={layout.onLayoutChanged}
      >
        <Panel id="view" minSize="35%">
          <ActiveView />
        </Panel>
        {inspectorOpen && (
          <>
            <Separator className="relative w-px bg-border outline-none after:absolute after:inset-y-0 after:-left-1 after:w-2 data-[separator=active]:bg-primary data-[separator=focus]:bg-primary data-[separator=hover]:bg-border-strong" />
            <Panel id="inspector" defaultSize="42%" minSize={380} maxSize="70%">
              <ErrorBoundary label="Inspector">
                <Inspector />
              </ErrorBoundary>
            </Panel>
          </>
        )}
      </Group>
    </div>
  )
}

/** Narrow screens: the sidebar and inspector become sheets over the active view. */
function CompactWorkspace({ filtered }: { filtered: boolean }) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const inspectorOpen = useAppStore((s) => s.inspectorOpen && s.selectedId !== null)
  const setInspectorOpen = useAppStore((s) => s.setInspectorOpen)

  return (
    <div className="min-h-0 flex-1">
      <ActiveView />
      {filtered && (
        <DialogPrimitive.Root open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" aria-describedby={undefined}>
            <VisuallyHidden.Root>
              <DialogPrimitive.Title>Filters</DialogPrimitive.Title>
            </VisuallyHidden.Root>
            <FilterSidebar className="h-full w-full border-0" />
          </SheetContent>
        </DialogPrimitive.Root>
      )}
      <DialogPrimitive.Root open={inspectorOpen} onOpenChange={setInspectorOpen}>
        <SheetContent side="right" aria-describedby={undefined} onOpenAutoFocus={(e) => e.preventDefault()}>
          <VisuallyHidden.Root>
            <DialogPrimitive.Title>Request details</DialogPrimitive.Title>
          </VisuallyHidden.Root>
          <Inspector />
        </SheetContent>
      </DialogPrimitive.Root>
    </div>
  )
}

export function Workspace() {
  const isDesktop = useIsDesktop()
  const filtered = viewById(useAppStore((s) => s.view)).filtered
  return isDesktop ? <DesktopWorkspace filtered={filtered} /> : <CompactWorkspace filtered={filtered} />
}
