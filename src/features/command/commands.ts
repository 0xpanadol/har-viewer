import {
  Bookmark,
  CircleAlert,
  Code,
  Download,
  Eye,
  FileStack,
  FileUp,
  FlaskConical,
  GitCompareArrows,
  Keyboard,
  Link,
  Monitor,
  Moon,
  NotebookPen,
  PanelLeft,
  Pin,
  Play,
  Regex,
  RotateCcw,
  Save,
  SquareCheck,
  Sun,
  Timer,
  Trash,
  X,
  type LucideIcon,
} from 'lucide-react'
import { GithubIcon, REPO_URL } from '@/components/brand'
import { toCurl } from '@/har/export/snippets'
import { pickFile } from '@/lib/file-picker'
import { copyText } from '@/lib/clipboard'
import { MOD } from '@/lib/platform'
import {
  closeCapture,
  loadComparison,
  mergeFile,
  openFile,
  openSample,
  persistSession,
} from '@/services/capture'
import { copyUrls, deleteEntries } from '@/services/entry-actions'
import { EXPORT_FORMATS, exportEntries, exportTarget } from '@/services/export'
import { useAppStore, type AppState } from '@/store'
import { selectSelectedEntry, selectVisibleEntries } from '@/store/selectors'
import { VIEWS } from '../shell/views'

export interface Command {
  id: string
  label: string
  icon?: LucideIcon | typeof GithubIcon
  shortcut?: readonly string[]
  keywords?: string[]
  run: () => void
}

export interface CommandGroup {
  heading: string
  commands: Command[]
}

const store = useAppStore.getState

export async function openFromPicker(): Promise<void> {
  const file = await pickFile()
  if (file) await openFile(file)
}

/** Every palette action, derived from current state so only applicable commands appear. */
export function buildCommands(state: AppState): CommandGroup[] {
  const selected = selectSelectedEntry(state)
  const checkedCount = state.checkedIds.length
  const target = checkedCount ? `${checkedCount} selected` : `${selectVisibleEntries(state).length} visible`

  const groups: CommandGroup[] = [
    {
      heading: 'Go to',
      commands: VIEWS.map((view, i) => ({
        id: `view-${view.id}`,
        label: view.label,
        icon: view.icon,
        shortcut: [String(i + 1)],
        keywords: [view.description],
        run: () => store().setView(view.id),
      })),
    },
  ]

  if (selected) {
    const pinned = state.pinnedIds.includes(selected.id)
    groups.push({
      heading: `Request #${selected.id + 1}`,
      commands: [
        { id: 'req-url', label: 'Copy URL', icon: Link, run: () => copyText(selected.url, 'URL copied') },
        {
          id: 'req-curl',
          label: 'Copy as cURL',
          icon: Code,
          run: () => copyText(toCurl(selected.raw), 'Copied as cURL'),
        },
        {
          id: 'req-pin',
          label: pinned ? 'Unpin request' : 'Pin request',
          icon: Pin,
          shortcut: ['P'],
          run: () => store().togglePinned(selected.id),
        },
        {
          id: 'req-note',
          label: 'Add or edit note',
          icon: NotebookPen,
          shortcut: ['N'],
          run: () => store().openDialog({ type: 'note', entryId: selected.id }),
        },
        {
          id: 'req-replay',
          label: 'Replay request',
          icon: Play,
          run: () => store().openDialog({ type: 'replay', entryId: selected.id }),
        },
        {
          id: 'req-delete',
          label: 'Delete request',
          icon: Trash,
          shortcut: ['Del'],
          run: () => deleteEntries([selected.id]),
        },
      ],
    })
  }

  groups.push({
    heading: 'Filter',
    commands: [
      {
        id: 'f-errors',
        label: 'Show only failed requests',
        icon: CircleAlert,
        keywords: ['errors', '4xx', '5xx'],
        run: () => store().applyCriteria({ statuses: ['4xx', '5xx', 'failed'] }),
      },
      {
        id: 'f-slow',
        label: 'Show slow requests (over 1 s)',
        icon: Timer,
        run: () => store().setTimeRange(1000, null),
      },
      {
        id: 'f-regex',
        label: state.useRegex ? 'Turn off regex search' : 'Search with regular expressions',
        icon: Regex,
        run: () => store().setUseRegex(!state.useRegex),
      },
      { id: 'f-reset', label: 'Reset all filters', icon: RotateCcw, run: () => store().resetFilters() },
      ...state.savedViews.map((view) => ({
        id: `saved-${view.id}`,
        label: `Apply view: ${view.name}`,
        icon: Bookmark,
        run: () => store().applyView(view.id),
      })),
    ],
  })

  groups.push({
    heading: 'Selection',
    commands: [
      {
        id: 's-all',
        label: 'Tick all visible requests',
        icon: SquareCheck,
        run: () =>
          store().setChecked(
            selectVisibleEntries(store()).map((e) => e.id),
            true,
          ),
      },
      ...(checkedCount
        ? [
            { id: 's-clear', label: 'Clear ticked requests', icon: X, run: () => store().clearChecked() },
            {
              id: 's-urls',
              label: `Copy URLs (${target})`,
              icon: Link,
              run: () => copyUrls(exportTarget().entries),
            },
            {
              id: 's-delete',
              label: `Delete ${target}`,
              icon: Trash,
              run: () => deleteEntries(store().checkedIds),
            },
          ]
        : []),
      ...(checkedCount === 2
        ? [
            {
              id: 's-diff',
              label: 'Diff the two ticked requests',
              icon: GitCompareArrows,
              run: () =>
                store().openDialog({ type: 'diff', ids: [state.checkedIds[0]!, state.checkedIds[1]!] }),
            },
          ]
        : []),
    ],
  })

  groups.push({
    heading: `Export ${target}`,
    commands: EXPORT_FORMATS.map((format) => ({
      id: `export-${format.id}`,
      label: `Export as ${format.label}`,
      icon: Download,
      keywords: [format.hint],
      run: () => {
        const { entries, label } = exportTarget()
        exportEntries(format.id, entries, label)
      },
    })),
  })

  groups.push({
    heading: 'File',
    commands: [
      {
        id: 'file-open',
        label: 'Open HAR file…',
        icon: FileUp,
        shortcut: [MOD, 'O'],
        run: () => void openFromPicker(),
      },
      {
        id: 'file-merge',
        label: 'Merge another HAR into this one…',
        icon: FileStack,
        run: async () => {
          const f = await pickFile()
          if (f) await mergeFile(f)
        },
      },
      {
        id: 'file-compare',
        label: 'Compare with another HAR…',
        icon: GitCompareArrows,
        run: async () => {
          const f = await pickFile()
          if (f) await loadComparison(f)
        },
      },
      {
        id: 'file-save',
        label: 'Save session',
        icon: Save,
        shortcut: [MOD, 'S'],
        run: () => void persistSession({ notify: true }),
      },
      { id: 'file-sample', label: 'Load sample capture', icon: FlaskConical, run: () => void openSample() },
      { id: 'file-close', label: 'Close capture', icon: X, run: () => void closeCapture() },
    ],
  })

  groups.push({
    heading: 'Preferences',
    commands: [
      { id: 'p-light', label: 'Theme: Light', icon: Sun, run: () => store().setTheme('light') },
      { id: 'p-dark', label: 'Theme: Dark', icon: Moon, run: () => store().setTheme('dark') },
      { id: 'p-system', label: 'Theme: System', icon: Monitor, run: () => store().setTheme('system') },
      {
        id: 'p-sidebar',
        label: state.sidebarOpen ? 'Hide filter sidebar' : 'Show filter sidebar',
        icon: PanelLeft,
        shortcut: ['F'],
        run: () => store().setSidebarOpen(!state.sidebarOpen),
      },
      {
        id: 'p-preview',
        label: state.urlPreviews ? 'Disable URL previews on hover' : 'Enable URL previews on hover',
        icon: Eye,
        run: () => store().setUrlPreviews(!state.urlPreviews),
      },
    ],
  })

  groups.push({
    heading: 'Help',
    commands: [
      {
        id: 'h-shortcuts',
        label: 'Keyboard shortcuts',
        icon: Keyboard,
        shortcut: ['?'],
        run: () => store().openDialog({ type: 'shortcuts' }),
      },
      {
        id: 'h-github',
        label: 'View source on GitHub',
        icon: GithubIcon,
        run: () => window.open(REPO_URL, '_blank', 'noopener,noreferrer'),
      },
    ],
  })

  return groups.filter((g) => g.commands.length > 0)
}
