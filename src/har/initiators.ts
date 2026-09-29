import type { Entry } from './types'

export interface InitiatorNode {
  entry: Entry
  children: InitiatorNode[]
  /** Total descendants, for the collapsed-state badge. */
  size: number
}

/**
 * Builds the "who requested what" forest from `_initiator.url` (Chrome) or the Referer header.
 * The first request for a URL owns its children; cycles are broken by only linking to earlier nodes.
 */
export function buildInitiatorTree(entries: readonly Entry[]): InitiatorNode[] {
  const ordered = entries.toSorted((a, b) => a.startTime - b.startTime || a.id - b.id)
  const nodes = ordered.map((entry): InitiatorNode => ({ entry, children: [], size: 0 }))
  const firstIndexByUrl = new Map<string, number>()
  nodes.forEach((node, i) => {
    if (!firstIndexByUrl.has(node.entry.url)) firstIndexByUrl.set(node.entry.url, i)
  })

  const roots: InitiatorNode[] = []
  nodes.forEach((node, i) => {
    const parentIndex = node.entry.initiator ? firstIndexByUrl.get(node.entry.initiator) : undefined
    // Only link to strictly earlier nodes, which makes cycles impossible.
    if (parentIndex !== undefined && parentIndex < i) nodes[parentIndex]!.children.push(node)
    else roots.push(node)
  })

  const measure = (node: InitiatorNode): number => {
    node.size = node.children.reduce((sum, child) => sum + 1 + measure(child), 0)
    return node.size
  }
  roots.forEach(measure)
  return roots
}
