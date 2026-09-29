import { ChevronsDownUp, ChevronsUpDown, Code, Download, ListOrdered, TextWrap } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import { SegmentedControl, SegmentedItem, Toggle } from '@/components/ui/tabs'
import { Tooltip } from '@/components/ui/tooltip'
import { prettyJson, tryParseJson } from '@/har/decode'
import { copyText } from '@/lib/clipboard'
import { downloadText } from '@/lib/download'
import { formatBytes, formatNumber } from '@/lib/format'
import { containerPaths } from './json-paths'
import { JsonTree } from './json-tree'
import { SourceView } from './source-view'
import type { Language } from './syntax'

/** Above these sizes the richer views cost more than they help. */
const TREE_LIMIT = 400_000
const SOURCE_LIMIT = 1_500_000

const EXTENSIONS: Record<Language, string> = {
  json: 'json',
  html: 'html',
  xml: 'xml',
  css: 'css',
  js: 'js',
  text: 'txt',
}

interface ResponseViewerProps {
  text: string
  language: Language
  mimeType: string
  size: number
}

export function ResponseViewer({ text, language, mimeType, size }: ResponseViewerProps) {
  const parsed = language === 'json' ? tryParseJson(text) : undefined
  const canTree = parsed !== null && typeof parsed === 'object' && text.length <= TREE_LIMIT
  const pretty = parsed !== undefined ? prettyJson(parsed) : text
  const truncated = pretty.length > SOURCE_LIMIT
  const source = truncated ? pretty.slice(0, SOURCE_LIMIT) : pretty

  const [mode, setMode] = useState<'tree' | 'source'>(canTree ? 'tree' : 'source')
  const [wrap, setWrap] = useState(true)
  const [lineNumbers, setLineNumbers] = useState(true)
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [hoverPath, setHoverPath] = useState('')

  const onToggle = (path: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })

  const onHover = (e: MouseEvent) => {
    const path = (e.target as HTMLElement).closest<HTMLElement>('[data-path]')?.dataset.path
    if (path && path !== hoverPath) setHoverPath(path)
  }

  const tree = mode === 'tree' && canTree
  const lineCount = source.split('\n').length

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-10 shrink-0 items-center gap-1 border-b px-3">
        {canTree && (
          <SegmentedControl
            type="single"
            value={mode}
            onValueChange={(v) => v && setMode(v as 'tree' | 'source')}
            aria-label="Display mode"
          >
            <SegmentedItem value="tree">Tree</SegmentedItem>
            <SegmentedItem value="source">
              <Code /> Source
            </SegmentedItem>
          </SegmentedControl>
        )}
        {tree ? (
          <>
            <Tooltip content="Expand all">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setCollapsed(new Set())}
                aria-label="Expand all"
              >
                <ChevronsUpDown />
              </Button>
            </Tooltip>
            <Tooltip content="Collapse all">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setCollapsed(new Set(containerPaths(parsed).filter((p) => p !== '$')))}
                aria-label="Collapse all"
              >
                <ChevronsDownUp />
              </Button>
            </Tooltip>
          </>
        ) : (
          <>
            <Tooltip content="Wrap lines">
              <Toggle pressed={wrap} onPressedChange={setWrap} aria-label="Wrap lines" className="size-7">
                <TextWrap />
              </Toggle>
            </Tooltip>
            <Tooltip content="Line numbers">
              <Toggle
                pressed={lineNumbers}
                onPressedChange={setLineNumbers}
                aria-label="Line numbers"
                className="size-7"
              >
                <ListOrdered />
              </Toggle>
            </Tooltip>
          </>
        )}
        <span className="ml-auto truncate px-2 text-xs text-subtle-foreground tabular">
          {formatBytes(size > 0 ? size : text.length)} · {formatNumber(lineCount)} lines ·{' '}
          {language.toUpperCase()}
        </span>
        <CopyButton value={text} label="Copy body" size="icon-sm" />
        <Tooltip content="Download body">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => downloadText(text, `response.${EXTENSIONS[language]}`, mimeType || 'text/plain')}
            aria-label="Download body"
          >
            <Download />
          </Button>
        </Tooltip>
      </div>

      {tree && (
        <button
          type="button"
          onClick={() => hoverPath && copyText(hoverPath, 'JSON path copied')}
          className="flex h-7 shrink-0 items-center gap-2 truncate border-b bg-muted/40 px-3 text-left font-mono text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:bg-muted"
          title="Click to copy the JSON path"
        >
          {hoverPath || (
            <span className="font-sans text-subtle-foreground">Hover a value to see its JSON path</span>
          )}
        </button>
      )}

      <div className="min-h-0 flex-1 overflow-auto" onMouseOver={tree ? onHover : undefined}>
        {tree ? (
          <JsonTree value={parsed} collapsed={collapsed} onToggle={onToggle} />
        ) : (
          <SourceView text={source} language={language} wrap={wrap} lineNumbers={lineNumbers} />
        )}
        {truncated && !tree && (
          <p className="border-t px-3 py-2 text-xs text-muted-foreground">
            Showing the first {formatBytes(SOURCE_LIMIT)} of {formatBytes(pretty.length)}. Download the body
            to see everything.
          </p>
        )}
      </div>
    </div>
  )
}
