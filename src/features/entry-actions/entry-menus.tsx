import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import type { Entry } from '@/har/types'
import { useAppStore } from '@/store'
import { buildEntryMenu, type MenuNode } from './menu-model'

function ContextNodes({ nodes }: { nodes: MenuNode[] }) {
  return nodes.map((node) => {
    if (node.kind === 'separator') return <ContextMenuSeparator key={node.id} />
    if (node.kind === 'submenu') {
      return (
        <ContextMenuSub key={node.id}>
          <ContextMenuSubTrigger>
            {node.icon && <node.icon />}
            {node.label}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextNodes nodes={node.items} />
          </ContextMenuSubContent>
        </ContextMenuSub>
      )
    }
    return (
      <ContextMenuItem
        key={node.id}
        variant={node.danger ? 'danger' : 'default'}
        disabled={node.disabled}
        onSelect={node.onSelect}
      >
        {node.icon && <node.icon />}
        {node.label}
        {node.shortcut && <ContextMenuShortcut>{node.shortcut}</ContextMenuShortcut>}
      </ContextMenuItem>
    )
  })
}

function DropdownNodes({ nodes }: { nodes: MenuNode[] }) {
  return nodes.map((node) => {
    if (node.kind === 'separator') return <DropdownMenuSeparator key={node.id} />
    if (node.kind === 'submenu') {
      return (
        <DropdownMenuSub key={node.id}>
          <DropdownMenuSubTrigger>
            {node.icon && <node.icon />}
            {node.label}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownNodes nodes={node.items} />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )
    }
    return (
      <DropdownMenuItem
        key={node.id}
        variant={node.danger ? 'danger' : 'default'}
        disabled={node.disabled}
        onSelect={node.onSelect}
      >
        {node.icon && <node.icon />}
        {node.label}
        {node.shortcut && <DropdownMenuShortcut>{node.shortcut}</DropdownMenuShortcut>}
      </DropdownMenuItem>
    )
  })
}

/** Menu content is built on open, so it always reflects the current pin/note/selection state. */
export function EntryContextMenuContent({ entry }: { entry: Entry }) {
  const state = useAppStore()
  return (
    <ContextMenuContent className="w-60">
      <ContextNodes nodes={buildEntryMenu(entry, state)} />
    </ContextMenuContent>
  )
}

export function EntryDropdownMenuContent({ entry }: { entry: Entry }) {
  const state = useAppStore()
  return (
    <DropdownMenuContent align="end" className="w-60">
      <DropdownNodes nodes={buildEntryMenu(entry, state)} />
    </DropdownMenuContent>
  )
}
