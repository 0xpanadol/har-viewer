import { FileUp, GitCompareArrows, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { captureStats, diffCaptures } from '@/har/compare'
import { pickFile } from '@/lib/file-picker'
import { loadComparison } from '@/services/capture'
import { useAppStore } from '@/store'
import { CompareChanges } from './compare-changes'
import { CompareSummary } from './compare-summary'

async function chooseComparison() {
  const file = await pickFile()
  if (file) await loadComparison(file)
}

export function CompareView() {
  const entries = useAppStore((s) => s.entries)
  const fileName = useAppStore((s) => s.fileName)
  const comparison = useAppStore((s) => s.comparison)
  const setComparison = useAppStore((s) => s.setComparison)

  if (!comparison) {
    return (
      <EmptyState
        icon={<GitCompareArrows />}
        title="Compare two captures"
        description={`Load a second HAR — e.g. after a deploy or config change — to see what got faster, slower, added or removed compared to ${fileName}.`}
        action={
          <Button variant="primary" size="sm" onClick={chooseComparison}>
            <FileUp /> Choose HAR file
          </Button>
        }
        className="h-full"
      />
    )
  }

  const a = captureStats(entries)
  const b = captureStats(comparison.entries)
  const diff = diffCaptures(entries, comparison.entries)

  return (
    <div className="@container h-full overflow-y-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4 @3xl:p-6">
        <header className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold tracking-tight">Compare</h1>
            <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate font-mono">{fileName}</span>
              <span aria-hidden>→</span>
              <span className="truncate font-mono text-foreground">{comparison.fileName}</span>
            </p>
          </div>
          <Button size="sm" onClick={chooseComparison}>
            <FileUp /> Replace
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setComparison(null)}>
            <X /> Clear
          </Button>
        </header>
        <CompareSummary a={a} b={b} nameA={fileName} nameB={comparison.fileName} />
        <CompareChanges diff={diff} />
      </div>
    </div>
  )
}
