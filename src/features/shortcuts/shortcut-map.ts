import { MOD } from '@/lib/platform'

export interface ShortcutGroup {
  title: string
  items: ReadonlyArray<{ keys: readonly string[]; label: string }>
}

/** Single source of truth for the shortcuts dialog; the handler lives in use-global-shortcuts. */
export const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    title: 'General',
    items: [
      { keys: [MOD, 'K'], label: 'Command palette' },
      { keys: [MOD, 'O'], label: 'Open a HAR file' },
      { keys: [MOD, 'S'], label: 'Save session' },
      { keys: [MOD, 'Z'], label: 'Undo delete' },
      { keys: ['1', '–', '7'], label: 'Switch view' },
      { keys: ['?'], label: 'Show keyboard shortcuts' },
    ],
  },
  {
    title: 'Navigate',
    items: [
      { keys: ['J', '/', '↓'], label: 'Next request' },
      { keys: ['K', '/', '↑'], label: 'Previous request' },
      { keys: ['Home', '/', 'End'], label: 'First / last request' },
      { keys: ['PgUp', '/', 'PgDn'], label: 'Jump 20 requests' },
      { keys: ['↵'], label: 'Open or close the inspector' },
      { keys: ['Esc'], label: 'Close inspector / clear selection' },
    ],
  },
  {
    title: 'Filter & find',
    items: [
      { keys: ['/'], label: 'Focus request filter' },
      { keys: ['F'], label: 'Toggle filter sidebar' },
      { keys: [MOD, 'F'], label: 'Find inside the inspected request' },
      { keys: ['↵'], label: 'Next match (in find)' },
    ],
  },
  {
    title: 'Selected request',
    items: [
      { keys: ['[', '/', ']'], label: 'Previous / next inspector tab' },
      { keys: ['X'], label: 'Tick for bulk actions' },
      { keys: ['Shift', 'Click'], label: 'Tick a range' },
      { keys: ['P'], label: 'Pin to top' },
      { keys: ['N'], label: 'Add a note' },
      { keys: ['Del'], label: 'Delete (ticked or selected)' },
    ],
  },
]
