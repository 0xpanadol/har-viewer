import { ChevronRight } from 'lucide-react'
import { memo } from 'react'
import { highlight, useFindQuery } from '@/components/find-query'
import { cn } from '@/lib/cn'
import { childPath } from './json-paths'
import { syntaxClass } from './syntax'

const INDENT = 16
interface NodeProps {
  name?: string
  value: unknown
  path: string
  depth: number
  last: boolean
  collapsed: ReadonlySet<string>
  onToggle: (path: string) => void
}

function Scalar({ value }: { value: unknown }) {
  const query = useFindQuery()
  if (typeof value === 'string')
    return <span className={syntaxClass.string}>{highlight(JSON.stringify(value), query)}</span>
  if (typeof value === 'number')
    return <span className={syntaxClass.number}>{highlight(String(value), query)}</span>
  return <span className={syntaxClass.literal}>{String(value)}</span>
}

function JsonNode({ name, value, path, depth, last, collapsed, onToggle }: NodeProps) {
  const query = useFindQuery()
  const comma = last ? null : <span className={syntaxClass.punct}>,</span>
  const label = name !== undefined && (
    <>
      <span className={syntaxClass.key}>{highlight(JSON.stringify(name), query)}</span>
      <span className={syntaxClass.punct}>: </span>
    </>
  )
  const pad = { paddingLeft: depth * INDENT + 20 }

  if (!value || typeof value !== 'object') {
    return (
      <div data-path={path} style={pad} className="break-all hover:bg-muted/40">
        {label}
        <Scalar value={value} />
        {comma}
      </div>
    )
  }

  const isArray = Array.isArray(value)
  const children: Array<[string | number, unknown]> = isArray
    ? value.map((v, i) => [i, v])
    : Object.entries(value)
  const [open, close] = isArray ? ['[', ']'] : ['{', '}']
  if (!children.length) {
    return (
      <div data-path={path} style={pad} className="hover:bg-muted/40">
        {label}
        <span className={syntaxClass.punct}>{open + close}</span>
        {comma}
      </div>
    )
  }

  const isCollapsed = collapsed.has(path)
  const summary = isArray ? `${children.length} items` : `${children.length} keys`
  return (
    <>
      <div data-path={path} style={pad} className="relative hover:bg-muted/40">
        <button
          type="button"
          onClick={() => onToggle(path)}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          className="absolute top-0.5 grid size-4 place-items-center rounded text-subtle-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          style={{ left: depth * INDENT + 2 }}
        >
          <ChevronRight className={cn('size-3 transition-transform', !isCollapsed && 'rotate-90')} />
        </button>
        {label}
        <span className={syntaxClass.punct}>{open}</span>
        {isCollapsed && (
          <>
            <button
              type="button"
              onClick={() => onToggle(path)}
              className="mx-1 rounded bg-muted px-1 text-2xs text-muted-foreground hover:text-foreground"
            >
              {summary}
            </button>
            <span className={syntaxClass.punct}>{close}</span>
            {comma}
          </>
        )}
      </div>
      {!isCollapsed && (
        <>
          {children.map(([key, child], i) => (
            <JsonNode
              key={key}
              name={isArray ? undefined : String(key)}
              value={child}
              path={childPath(path, key)}
              depth={depth + 1}
              last={i === children.length - 1}
              collapsed={collapsed}
              onToggle={onToggle}
            />
          ))}
          <div style={pad}>
            <span className={syntaxClass.punct}>{close}</span>
            {comma}
          </div>
        </>
      )}
    </>
  )
}

interface JsonTreeProps {
  value: unknown
  collapsed: ReadonlySet<string>
  onToggle: (path: string) => void
}

export const JsonTree = memo(function JsonTree({ value, collapsed, onToggle }: JsonTreeProps) {
  return (
    <div className="py-2 pr-4 font-mono text-xs leading-5">
      <JsonNode value={value} path="$" depth={0} last collapsed={collapsed} onToggle={onToggle} />
    </div>
  )
})
