import { FileDown, LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

export function LoadingScreen({
  label,
  detail,
  progress,
}: {
  label: string
  detail?: string
  progress: number | null
}) {
  return (
    <div className="grid h-full place-items-center p-6" role="status" aria-live="polite">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <LoaderCircle className="size-6 animate-spin text-primary" />
        <div>
          <p className="text-[13px] font-medium">{label}</p>
          {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full bg-primary transition-[width] duration-200',
              progress === null && 'w-1/3 animate-pulse',
            )}
            style={progress === null ? undefined : { width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function DropOverlay({ visible, replacing }: { visible: boolean; replacing: boolean }) {
  if (!visible) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] grid animate-in place-items-center bg-background/70 p-6 backdrop-blur-sm fade-in-0">
      <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-panel px-8 py-12 text-center shadow-overlay">
        <FileDown className="size-7 text-primary" />
        <p className="text-sm font-semibold">Drop to open</p>
        <p className="text-xs text-muted-foreground">
          {replacing
            ? 'Replaces the current capture. Drop several files to merge them.'
            : 'Drop several files to merge them into one capture.'}
        </p>
      </div>
    </div>
  )
}
