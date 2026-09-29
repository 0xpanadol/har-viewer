import { useEffect } from 'react'
import { isEditableTarget, isModKey, isOverlayOpen } from '@/lib/platform'
import { persistSession } from '@/services/capture'
import { deleteEntries, undoDelete } from '@/services/entry-actions'
import { moveSelection } from '@/services/navigation'
import { useAppStore } from '@/store'
import { selectSelectedEntry } from '@/store/selectors'
import { openFromPicker } from '../command/commands'
import { SEARCH_INPUT_ID } from '../filters/search-field'
import { FIND_INPUT_ID } from '../inspector/find-bar'
import { inspectorTabs } from '../inspector/inspector-tabs'
import { VIEWS, viewById } from '../shell/views'

const store = useAppStore.getState

/** Widgets that use arrow/Enter keys themselves (Radix tabs, menus, radio groups, trees…). */
function ownsKeys(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest(
      '[role="tablist"],[role="radiogroup"],[role="menu"],[role="listbox"],[role="tree"],button,a,[role="button"]',
    ) !== null
  )
}

function focusById(id: string): boolean {
  const el = document.getElementById(id)
  if (!(el instanceof HTMLInputElement)) return false
  el.focus()
  el.select()
  return true
}

function focusSearch() {
  const s = store()
  if (!viewById(s.view).filtered) s.setView('requests')
  requestAnimationFrame(() => focusById(SEARCH_INPUT_ID))
}

function cycleInspectorTab(direction: 1 | -1) {
  const s = store()
  const entry = selectSelectedEntry(s)
  if (!entry || !s.inspectorOpen) return
  const tabs = inspectorTabs(entry).map((t) => t.id)
  const index = Math.max(0, tabs.indexOf(s.inspectorTab))
  s.setInspectorTab(tabs[(index + direction + tabs.length) % tabs.length]!)
}

function handleChord(e: KeyboardEvent): boolean {
  const s = store()
  switch (e.key.toLowerCase()) {
    case 'k':
      if (s.dialog.type === 'palette') s.closeDialog()
      else s.openDialog({ type: 'palette' })
      return true
    case 's':
      void persistSession({ notify: true })
      return true
    case 'o':
      void openFromPicker()
      return true
    case 'f':
      if (s.inspectorOpen && s.selectedId !== null && focusById(FIND_INPUT_ID)) return true
      focusSearch()
      return true
    case 'z':
      if (isEditableTarget(e.target)) return false
      undoDelete()
      return true
    default:
      return false
  }
}

function handleKey(e: KeyboardEvent): boolean {
  const s = store()
  const selected = s.selectedId
  const navigable = viewById(s.view).filtered

  if (/^[1-7]$/.test(e.key)) {
    s.setView(VIEWS[Number(e.key) - 1]!.id)
    return true
  }

  switch (e.key) {
    case '?':
      s.openDialog({ type: 'shortcuts' })
      return true
    case '/':
      focusSearch()
      return true
    case 'f':
      s.setSidebarOpen(!s.sidebarOpen)
      return true
    case 'j':
    case 'ArrowDown':
      if (!navigable || ownsKeys(e.target)) return false
      moveSelection(1)
      return true
    case 'k':
    case 'ArrowUp':
      if (!navigable || ownsKeys(e.target)) return false
      moveSelection(-1)
      return true
    case 'Home':
    case 'End':
      if (!navigable) return false
      moveSelection(e.key === 'Home' ? 'first' : 'last')
      return true
    case 'PageDown':
    case 'PageUp':
      if (!navigable) return false
      moveSelection(e.key === 'PageDown' ? 20 : -20)
      return true
    case 'Enter':
      if (selected === null || ownsKeys(e.target)) return false
      s.setInspectorOpen(!s.inspectorOpen)
      return true
    case 'Escape':
      if (s.inspectorOpen) s.setInspectorOpen(false)
      else if (s.checkedIds.length) s.clearChecked()
      else if (selected !== null) s.clearSelection()
      else return false
      return true
    case '[':
    case ']':
      cycleInspectorTab(e.key === ']' ? 1 : -1)
      return true
  }

  if (selected === null) return false
  switch (e.key) {
    case 'x':
      s.toggleChecked(selected)
      return true
    case 'p':
      s.togglePinned(selected)
      return true
    case 'n':
      s.openDialog({ type: 'note', entryId: selected })
      return true
    case 'Delete':
    case 'Backspace':
      deleteEntries(s.checkedIds.length ? s.checkedIds : [selected])
      return true
  }
  return false
}

export function useGlobalShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return
      const chord = isModKey(e) && !e.altKey && !e.shiftKey
      // Without a capture only "open" makes sense.
      if (store().log === null) {
        if (chord && e.key.toLowerCase() === 'o') {
          e.preventDefault()
          void openFromPicker()
        }
        return
      }
      const handled = chord
        ? handleChord(e)
        : !isModKey(e) && !e.altKey && !isEditableTarget(e.target) && !isOverlayOpen() && handleKey(e)
      if (handled) e.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
