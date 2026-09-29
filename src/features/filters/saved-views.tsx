import { Bookmark, BookmarkPlus, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { countActiveFilters } from '@/har/filter'
import { useAppStore } from '@/store'
import { useCriteria } from '@/store/selectors'

export function SavedViews() {
  const views = useAppStore((s) => s.savedViews)
  const applyView = useAppStore((s) => s.applyView)
  const deleteView = useAppStore((s) => s.deleteView)

  return (
    <div className="flex flex-col gap-0.5 px-2 py-2">
      <div className="flex h-7 items-center justify-between px-1.5">
        <span className="text-xs font-medium text-muted-foreground">Saved views</span>
        <SaveViewButton />
      </div>
      {views.length === 0 && (
        <p className="px-1.5 text-2xs text-subtle-foreground">
          Save a filter combination to reuse it on any capture.
        </p>
      )}
      {views.map((view) => (
        <div key={view.id} className="group/view flex h-7 items-center rounded-md hover:bg-muted">
          <button
            type="button"
            onClick={() => applyView(view.id)}
            className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <Bookmark className="size-3.5 shrink-0 text-subtle-foreground" />
            <span className="truncate">{view.name}</span>
          </button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="mr-0.5 opacity-0 group-hover/view:opacity-100 focus-visible:opacity-100"
            onClick={() => deleteView(view.id)}
            aria-label={`Delete ${view.name}`}
          >
            <X />
          </Button>
        </div>
      ))}
    </div>
  )
}

function SaveViewButton() {
  const saveView = useAppStore((s) => s.saveView)
  const hasFilters = countActiveFilters(useCriteria()) > 0
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const save = () => {
    if (!name.trim()) return
    saveView(name.trim())
    setName('')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={!hasFilters}
          aria-label="Save current filters as a view"
        >
          <BookmarkPlus />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
          className="flex flex-col gap-2"
        >
          <label htmlFor="view-name" className="text-xs font-medium">
            Save current filters
          </label>
          <Input
            id="view-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. API errors"
          />
          <Button type="submit" variant="primary" size="sm" disabled={!name.trim()}>
            Save view
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
