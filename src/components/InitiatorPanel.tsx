import { useMemo } from 'react'
import { useHarStore } from '../store/harStore'
import { ResizableOverlay } from './ResizableOverlay'
import { parseUrl } from '../utils/parsers'

interface TreeNode {
  url: string
  host: string
  path: string
  children: TreeNode[]
  entryIdx: number
}

export function InitiatorPanel() {
  const allEntries = useHarStore((s) => s.allEntries)
  const setOverlayPanel = useHarStore((s) => s.setOverlayPanel)
  const setSelectedIdx = useHarStore((s) => s.setSelectedIdx)
  const setDetailPanelOpen = useHarStore((s) => s.setDetailPanelOpen)

  const tree = useMemo(() => {
    const nodeMap = new Map<string, TreeNode>()
    const roots: TreeNode[] = []

    // Create nodes for all entries
    allEntries.forEach((e) => {
      const parsed = parseUrl(e.url)
      nodeMap.set(e.url, { url: e.url, host: parsed.host, path: parsed.path, children: [], entryIdx: e._idx })
    })

    // Build tree based on initiator
    allEntries.forEach((e) => {
      const node = nodeMap.get(e.url)
      if (!node) return
      const initiator = e.initiator
      if (initiator && nodeMap.has(initiator)) {
        nodeMap.get(initiator)!.children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }, [allEntries])

  const handleClick = (idx: number) => {
    setSelectedIdx(idx)
    setDetailPanelOpen(true)
  }

  return (
    <ResizableOverlay initialWidth={420}>
      <div className="overlay-header">
        <span className="overlay-title">Request Initiator Chain</span>
        <button className="detail-close" onClick={() => setOverlayPanel('none')}>✕</button>
      </div>
      <div className="overlay-body">
        <div className="initiator-tree" role="tree" aria-label="Request dependency tree">
          {tree.length === 0 && <div style={{ color: 'var(--text-3)', padding: 16 }}>No initiator data available</div>}
          {tree.map((node, i) => (
            <TreeItem key={i} node={node} depth={0} onClick={handleClick} />
          ))}
        </div>
      </div>
    </ResizableOverlay>
  )
}

function TreeItem({ node, depth, onClick }: { node: TreeNode; depth: number; onClick: (idx: number) => void }) {
  return (
    <div role="treeitem" aria-expanded={node.children.length > 0}>
      <div
        className="initiator-node"
        style={{ paddingLeft: 12 + depth * 20 }}
        onClick={() => onClick(node.entryIdx)}
        title={node.url}
      >
        {node.children.length > 0 && <span className="initiator-arrow">▸</span>}
        <span className="initiator-host">{node.host}</span>
        <span className="initiator-path">{node.path.length > 60 ? node.path.slice(0, 60) + '…' : node.path}</span>
        {node.children.length > 0 && <span className="initiator-count">({node.children.length})</span>}
      </div>
      {node.children.map((child, i) => (
        <TreeItem key={i} node={child} depth={depth + 1} onClick={onClick} />
      ))}
    </div>
  )
}
