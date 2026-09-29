import { useVirtualizer } from '@tanstack/react-virtual'
import { SearchX } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { bestTabForMatch, cachedMatchLocations } from '@/har/search'
import type { Entry } from '@/har/types'
import { useElementWidth } from '@/hooks/use-element-size'
import { useAppStore } from '@/store'
import {
  selectCheckedSet,
  selectDuplicateKeys,
  selectEntryMap,
  selectPinnedSet,
  useVisibleEntries,
} from '@/store/selectors'
import { EntryContextMenuContent } from '../entry-actions/entry-menus'
import { fitColumns, gridTemplate, ROW_HEIGHT } from './columns'
import { RequestRow } from './request-row'
import { TableHeader } from './table-header'

export function RequestTable() {
  const entries = useVisibleEntries()
  const preferredColumns = useAppStore((s) => s.columns)
  const selectedId = useAppStore((s) => s.selectedId)
  const checked = useAppStore(selectCheckedSet)
  const pinned = useAppStore(selectPinnedSet)
  const notes = useAppStore((s) => s.notes)
  const duplicates = useAppStore(selectDuplicateKeys)
  const urlPreviews = useAppStore((s) => s.urlPreviews)
  const query = useAppStore((s) => s.query)
  const useRegex = useAppStore((s) => s.useRegex)
  const range = useAppStore((s) => s.range)

  const rootRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const width = useElementWidth(rootRef)
  const columns = useMemo(() => fitColumns(preferredColumns, width), [preferredColumns, width])
  const anchorIndex = useRef<number | null>(null)
  const [menuEntryId, setMenuEntryId] = useState<number | null>(null)
  const menuEntry = useAppStore((s) =>
    menuEntryId === null ? undefined : selectEntryMap(s).get(menuEntryId),
  )

  // TanStack Virtual is opaque to the React Compiler, which therefore skips this component;
  // row callbacks below are memoized by hand so RequestRow's memo() still holds.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    getItemKey: (index) => entries[index]?.id ?? index,
  })

  // Restore the persisted scroll offset once, then keep it updated.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = useAppStore.getState().scrollTop
    let timer: ReturnType<typeof setTimeout>
    const onScroll = () => {
      clearTimeout(timer)
      timer = setTimeout(() => useAppStore.getState().setScrollTop(el.scrollTop), 200)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      el.removeEventListener('scroll', onScroll)
    }
  }, [])

  // Keep the selection visible when it moves via keyboard or from another view.
  useEffect(() => {
    if (selectedId === null) return
    const index = entries.findIndex((e) => e.id === selectedId)
    if (index >= 0) virtualizer.scrollToIndex(index, { align: 'auto' })
  }, [selectedId, entries, virtualizer])

  const onSelect = useCallback(
    (entry: Entry) => {
      const tab = bestTabForMatch(cachedMatchLocations(entry, query, useRegex))
      useAppStore.getState().inspect(entry.id, tab ?? undefined)
    },
    [query, useRegex],
  )

  const onCheck = useCallback(
    (entry: Entry, index: number, shiftKey: boolean) => {
      const state = useAppStore.getState()
      if (shiftKey && anchorIndex.current !== null) {
        const [from, to] = [Math.min(anchorIndex.current, index), Math.max(anchorIndex.current, index)]
        state.setChecked(
          entries.slice(from, to + 1).map((e) => e.id),
          true,
        )
      } else {
        state.toggleChecked(entry.id)
      }
      anchorIndex.current = index
    },
    [entries],
  )

  const allChecked = entries.length > 0 && entries.every((e) => checked.has(e.id))
  const someChecked = !allChecked && entries.some((e) => checked.has(e.id))
  const toggleAll = () =>
    useAppStore.getState().setChecked(
      entries.map((e) => e.id),
      !allChecked,
    )

  const onContextMenu = (event: MouseEvent) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-entry-id]')
    if (!row) return event.preventDefault()
    setMenuEntryId(Number(row.dataset.entryId))
  }

  const template = useMemo(() => gridTemplate(columns), [columns])
  const duration = range.end - range.start

  return (
    <div
      ref={rootRef}
      role="grid"
      aria-rowcount={entries.length + 1}
      aria-label="Requests"
      className="flex min-h-0 flex-1 flex-col"
    >
      <TableHeader
        columns={columns}
        template={template}
        allChecked={allChecked}
        someChecked={someChecked}
        onToggleAll={toggleAll}
      />
      {entries.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title="No requests match"
          description="Try a different search, or remove some filters."
          action={
            <Button size="sm" onClick={() => useAppStore.getState().resetFilters()}>
              Clear filters
            </Button>
          }
          className="flex-1"
        />
      ) : (
        <ContextMenu onOpenChange={(open) => !open && setMenuEntryId(null)}>
          <ContextMenuTrigger asChild>
            <div
              ref={scrollRef}
              onContextMenu={onContextMenu}
              className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
            >
              <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
                {virtualizer.getVirtualItems().map((item) => {
                  const entry = entries[item.index]!
                  return (
                    <RequestRow
                      key={item.key}
                      entry={entry}
                      index={item.index}
                      offset={item.start}
                      template={template}
                      columns={columns}
                      selected={entry.id === selectedId}
                      checked={checked.has(entry.id)}
                      pinned={pinned.has(entry.id)}
                      duplicate={duplicates.has(`${entry.method} ${entry.url}`)}
                      note={notes[entry.id]?.text}
                      preview={urlPreviews}
                      locations={cachedMatchLocations(entry, query, useRegex)}
                      captureStart={range.start}
                      captureDuration={duration}
                      onSelect={onSelect}
                      onCheck={onCheck}
                    />
                  )
                })}
              </div>
            </div>
          </ContextMenuTrigger>
          {menuEntry && <EntryContextMenuContent entry={menuEntry} />}
        </ContextMenu>
      )}
    </div>
  )
}
