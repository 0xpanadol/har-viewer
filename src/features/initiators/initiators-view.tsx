import { ChevronRight, ChevronsDownUp, ChevronsUpDown, ListTree } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { MethodLabel } from '@/components/http-labels'
import { STATUS_DOT } from '@/components/status-colors'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { buildInitiatorTree, type InitiatorNode } from '@/har/initiators'
import { statusGroup } from '@/har/parse'
import { cn } from '@/lib/cn'
import { formatDuration } from '@/lib/format'
import { useAppStore } from '@/store'

interface NodeProps {
  node: InitiatorNode
  depth: number
  collapsed: ReadonlySet<number>
  onToggle: (id: number) => void
  selectedId: number | null
}

function TreeNode({ node, depth, collapsed, onToggle, selectedId }: NodeProps) {
  const { entry } = node
  const open = !collapsed.has(entry.id)
  const hasChildren = node.children.length > 0

  return (
    <li
      role="treeitem"
      aria-expanded={hasChildren ? open : undefined}
      aria-selected={entry.id === selectedId}
    >
      <div
        className={cn(
          'group/node flex h-7 cursor-default items-center gap-2 pr-4 text-xs hover:bg-muted/60',
          entry.id === selectedId && 'bg-selection-strong',
        )}
        style={{ paddingLeft: 12 + depth * 18 }}
        onClick={() => useAppStore.getState().inspect(entry.id)}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) onToggle(entry.id)
          }}
          className={cn(
            'grid size-4 shrink-0 place-items-center rounded text-subtle-foreground outline-none hover:bg-muted',
            !hasChildren && 'invisible',
          )}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          <ChevronRight className={cn('size-3 transition-transform', open && 'rotate-90')} />
        </button>
        <span className={cn('size-1.5 shrink-0 rounded-full', STATUS_DOT[statusGroup(entry.status)])} />
        <MethodLabel method={entry.method} className="w-12 shrink-0 text-2xs" />
        <span className="min-w-0 flex-1 truncate font-mono" title={entry.url}>
          <span className="text-subtle-foreground">{entry.host}</span>
          {entry.path}
        </span>
        {hasChildren && (
          <span className="rounded bg-muted px-1.5 text-2xs text-muted-foreground tabular">{node.size}</span>
        )}
        <span className="w-16 shrink-0 text-right font-mono text-subtle-foreground tabular">
          {formatDuration(entry.time)}
        </span>
      </div>
      {hasChildren && open && (
        <ul
          role="group"
          className="relative before:absolute before:inset-y-0 before:left-(--guide) before:w-px before:bg-border"
          style={{ '--guide': `${12 + depth * 18 + 9}px` } as CSSProperties}
        >
          {node.children.map((child) => (
            <TreeNode
              key={child.entry.id}
              node={child}
              depth={depth + 1}
              collapsed={collapsed}
              onToggle={onToggle}
              selectedId={selectedId}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

const collectParents = (nodes: InitiatorNode[], out: number[] = []): number[] => {
  for (const n of nodes) {
    if (n.children.length) {
      out.push(n.entry.id)
      collectParents(n.children, out)
    }
  }
  return out
}

export function InitiatorsView() {
  const entries = useAppStore((s) => s.entries)
  const selectedId = useAppStore((s) => s.selectedId)
  const tree = buildInitiatorTree(entries)
  const [collapsed, setCollapsed] = useState<ReadonlySet<number>>(new Set())
  const linked = entries.length - tree.length

  const onToggle = (id: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  if (!linked) {
    return (
      <EmptyState
        icon={<ListTree />}
        title="No initiator data"
        description="This capture has no _initiator fields or Referer headers linking requests together. Chrome captures include them."
        className="h-full"
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[13px] font-semibold">Initiator chain</h1>
          <p className="truncate text-xs text-muted-foreground">
            {linked} of {entries.length} requests were triggered by another request in this capture
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(new Set())}>
          <ChevronsUpDown /> Expand all
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(new Set(collectParents(tree)))}>
          <ChevronsDownUp /> Collapse all
        </Button>
      </div>
      <ul role="tree" aria-label="Request initiators" className="min-h-0 flex-1 overflow-y-auto py-1">
        {tree.map((node) => (
          <TreeNode
            key={node.entry.id}
            node={node}
            depth={0}
            collapsed={collapsed}
            onToggle={onToggle}
            selectedId={selectedId}
          />
        ))}
      </ul>
    </div>
  )
}
