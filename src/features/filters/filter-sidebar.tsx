import { STATUS_DOT } from '@/components/status-colors'
import { Button } from '@/components/ui/button'
import { STATUS_LABELS, type FacetKind } from '@/har/facets'
import { countActiveFilters, parseByteSize } from '@/har/filter'
import type { StatusGroup } from '@/har/types'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/format'
import { useAppStore } from '@/store'
import { selectFacets, useCriteria } from '@/store/selectors'
import { FacetList, FacetSection } from './facet-section'
import { RangeFacet } from './range-facet'
import { SavedViews } from './saved-views'

const DURATION_PRESETS = [
  { label: '> 100 ms', min: 100 },
  { label: '> 500 ms', min: 500 },
  { label: '> 1 s', min: 1000 },
  { label: '> 3 s', min: 3000 },
]

const SIZE_PRESETS = [
  { label: '> 10 KB', min: 10 * 1024 },
  { label: '> 100 KB', min: 100 * 1024 },
  { label: '> 1 MB', min: 1024 * 1024 },
]

const parseMs = (input: string) => {
  const n = Number(input.replace(/ms$/i, '').trim())
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function FilterSidebar({ className }: { className?: string }) {
  const facets = useAppStore(selectFacets)
  const criteria = useCriteria()
  const toggleFacet = useAppStore((s) => s.toggleFacet)
  const setFacet = useAppStore((s) => s.setFacet)
  const setTimeRange = useAppStore((s) => s.setTimeRange)
  const setSizeRange = useAppStore((s) => s.setSizeRange)
  const resetFilters = useAppStore((s) => s.resetFilters)
  const active = countActiveFilters(criteria)

  const facetProps = (kind: FacetKind) => ({
    selected: criteria[kind],
    onToggle: (value: string) => toggleFacet(kind, value),
    onOnly: (value: string) => setFacet(kind, [value]),
  })

  return (
    <aside aria-label="Filters" className={cn('flex w-60 shrink-0 flex-col border-r bg-panel', className)}>
      <div className="flex h-10 shrink-0 items-center justify-between border-b px-3.5">
        <span className="text-[13px] font-semibold">Filters</span>
        <Button variant="ghost" size="xs" onClick={resetFilters} disabled={active === 0}>
          Reset
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <FacetSection
          title="Status"
          activeCount={criteria.statuses.length}
          onClear={() => setFacet('statuses', [])}
        >
          <FacetList
            options={facets.statuses}
            {...facetProps('statuses')}
            renderLabel={(o) => (
              <span className="inline-flex items-center gap-2">
                <span className={cn('size-1.5 rounded-full', STATUS_DOT[o.value as StatusGroup])} />
                <span className="font-mono">{o.value}</span>
                <span className="text-subtle-foreground">{STATUS_LABELS[o.value as StatusGroup]}</span>
              </span>
            )}
          />
        </FacetSection>

        <FacetSection
          title="Method"
          activeCount={criteria.methods.length}
          onClear={() => setFacet('methods', [])}
        >
          <FacetList
            options={facets.methods}
            {...facetProps('methods')}
            renderLabel={(o) => <span className="font-mono">{o.value}</span>}
          />
        </FacetSection>

        <FacetSection title="Type" activeCount={criteria.types.length} onClear={() => setFacet('types', [])}>
          <FacetList options={facets.types} {...facetProps('types')} limit={8} />
        </FacetSection>

        <FacetSection
          title="Domain"
          activeCount={criteria.domains.length}
          onClear={() => setFacet('domains', [])}
        >
          <FacetList
            options={facets.domains}
            {...facetProps('domains')}
            limit={8}
            renderLabel={(o) => <span className="font-mono">{o.value || '(none)'}</span>}
          />
        </FacetSection>

        <FacetSection
          title="Duration"
          activeCount={criteria.minTime !== null || criteria.maxTime !== null ? 1 : 0}
          onClear={() => setTimeRange(null, null)}
          defaultOpen={false}
        >
          <RangeFacet
            min={criteria.minTime}
            max={criteria.maxTime}
            onChange={setTimeRange}
            parse={parseMs}
            format={(v) => String(v)}
            presets={DURATION_PRESETS}
            placeholder={['Min ms', 'Max ms']}
          />
        </FacetSection>

        <FacetSection
          title="Size"
          activeCount={criteria.minSize !== null || criteria.maxSize !== null ? 1 : 0}
          onClear={() => setSizeRange(null, null)}
          defaultOpen={false}
        >
          <RangeFacet
            min={criteria.minSize}
            max={criteria.maxSize}
            onChange={setSizeRange}
            parse={parseByteSize}
            format={(v) => formatBytes(v).replace(' ', '').toLowerCase()}
            presets={SIZE_PRESETS}
            placeholder={['Min (10kb)', 'Max']}
          />
        </FacetSection>

        <SavedViews />
      </div>
    </aside>
  )
}
