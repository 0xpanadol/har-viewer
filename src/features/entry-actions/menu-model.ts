import {
  Braces,
  Code,
  Cookie,
  Copy,
  Download,
  ExternalLink,
  GitCompareArrows,
  Link,
  NotebookPen,
  Pin,
  PinOff,
  Play,
  ShieldCheck,
  SquareCheck,
  Trash,
  type LucideIcon,
} from 'lucide-react'
import { SNIPPET_FORMATS } from '@/har/export/snippets'
import type { Entry } from '@/har/types'
import {
  copyCookieHeader,
  copyRequestHeaders,
  copyResponseBody,
  copySnippet,
  copyUrl,
  deleteEntries,
} from '@/services/entry-actions'
import { exportEntries } from '@/services/export'
import { useAppStore, type AppState } from '@/store'

export type MenuNode =
  | {
      kind: 'item'
      id: string
      label: string
      icon?: LucideIcon
      shortcut?: string
      danger?: boolean
      disabled?: boolean
      onSelect: () => void
    }
  | { kind: 'submenu'; id: string; label: string; icon?: LucideIcon; items: MenuNode[] }
  | { kind: 'separator'; id: string }

/** The other request to diff against: the inspected one, or a single other ticked row. */
export function diffPartner(state: AppState, id: number): number | null {
  if (state.selectedId !== null && state.selectedId !== id) return state.selectedId
  const others = state.checkedIds.filter((x) => x !== id)
  return others.length === 1 ? others[0]! : null
}

/** Everything you can do to one request — rendered as both a context menu and a dropdown. */
export function buildEntryMenu(entry: Entry, state: AppState): MenuNode[] {
  const pinned = state.pinnedIds.includes(entry.id)
  const checked = state.checkedIds.includes(entry.id)
  const hasNote = Boolean(state.notes[entry.id])
  const partner = diffPartner(state, entry.id)
  const store = useAppStore.getState

  return [
    { kind: 'item', id: 'copy-url', label: 'Copy URL', icon: Link, onSelect: () => copyUrl(entry) },
    {
      kind: 'submenu',
      id: 'copy-as',
      label: 'Copy as',
      icon: Code,
      items: SNIPPET_FORMATS.map((format) => ({
        kind: 'item' as const,
        id: format.id,
        label: format.label,
        onSelect: () => copySnippet(entry, format),
      })),
    },
    {
      kind: 'item',
      id: 'copy-body',
      label: 'Copy response body',
      icon: Braces,
      onSelect: () => copyResponseBody(entry),
    },
    {
      kind: 'item',
      id: 'copy-headers',
      label: 'Copy request headers',
      icon: Copy,
      onSelect: () => copyRequestHeaders(entry),
    },
    {
      kind: 'item',
      id: 'copy-cookies',
      label: 'Copy cookies as header',
      icon: Cookie,
      onSelect: () => copyCookieHeader([entry]),
    },
    { kind: 'separator', id: 'sep-export' },
    {
      kind: 'submenu',
      id: 'export',
      label: 'Export',
      icon: Download,
      items: [
        {
          kind: 'item',
          id: 'har',
          label: 'As HAR',
          onSelect: () => exportEntries('har', [entry], `request-${entry.id + 1}`),
        },
        {
          kind: 'item',
          id: 'har-sanitized',
          label: 'As sanitized HAR',
          icon: ShieldCheck,
          onSelect: () => exportEntries('har-sanitized', [entry], `request-${entry.id + 1}`),
        },
        {
          kind: 'item',
          id: 'cookies-netscape',
          label: 'Cookies (cookies.txt)',
          onSelect: () => exportEntries('cookies-netscape', [entry], `request-${entry.id + 1}`),
        },
        {
          kind: 'item',
          id: 'cookies-json',
          label: 'Cookies (JSON)',
          onSelect: () => exportEntries('cookies-json', [entry], `request-${entry.id + 1}`),
        },
      ],
    },
    { kind: 'separator', id: 'sep-organize' },
    {
      kind: 'item',
      id: 'pin',
      label: pinned ? 'Unpin' : 'Pin to top',
      icon: pinned ? PinOff : Pin,
      shortcut: 'P',
      onSelect: () => store().togglePinned(entry.id),
    },
    {
      kind: 'item',
      id: 'note',
      label: hasNote ? 'Edit note' : 'Add note',
      icon: NotebookPen,
      shortcut: 'N',
      onSelect: () => store().openDialog({ type: 'note', entryId: entry.id }),
    },
    {
      kind: 'item',
      id: 'check',
      label: checked ? 'Deselect' : 'Select',
      icon: SquareCheck,
      shortcut: 'X',
      onSelect: () => store().toggleChecked(entry.id),
    },
    {
      kind: 'item',
      id: 'diff',
      label: partner === null ? 'Diff with… (inspect or tick another first)' : `Diff with #${partner + 1}`,
      icon: GitCompareArrows,
      disabled: partner === null,
      onSelect: () => partner !== null && store().openDialog({ type: 'diff', ids: [partner, entry.id] }),
    },
    { kind: 'separator', id: 'sep-actions' },
    {
      kind: 'item',
      id: 'replay',
      label: 'Replay request',
      icon: Play,
      onSelect: () => store().openDialog({ type: 'replay', entryId: entry.id }),
    },
    {
      kind: 'item',
      id: 'open',
      label: 'Open URL in new tab',
      icon: ExternalLink,
      onSelect: () => window.open(entry.url, '_blank', 'noopener,noreferrer'),
    },
    {
      kind: 'item',
      id: 'delete',
      label: 'Delete',
      icon: Trash,
      shortcut: 'Del',
      danger: true,
      onSelect: () => deleteEntries([entry.id]),
    },
  ]
}
