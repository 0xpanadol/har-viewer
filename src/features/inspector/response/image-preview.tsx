import { Download } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { base64ToBytes } from '@/har/decode'
import type { HarContent } from '@/har/types'
import { downloadBlob } from '@/lib/download'
import { formatBytes } from '@/lib/format'

function imageSource(content: HarContent): string {
  if (content.encoding === 'base64') return `data:${content.mimeType};base64,${content.text}`
  return `data:${content.mimeType};charset=utf-8,${encodeURIComponent(content.text ?? '')}`
}

export function ImagePreview({ content }: { content: HarContent }) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const extension = content.mimeType.split('/')[1]?.replace(/\+.*$/, '') || 'img'

  const download = () => {
    const bytes =
      content.encoding === 'base64'
        ? base64ToBytes(content.text ?? '')
        : new TextEncoder().encode(content.text ?? '')
    downloadBlob(new Blob([bytes], { type: content.mimeType }), `response.${extension}`)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3 text-xs text-muted-foreground">
        <span className="font-mono">{content.mimeType}</span>
        {size && (
          <span className="tabular">
            {size.width} × {size.height}
          </span>
        )}
        <span className="tabular">{formatBytes(content.size)}</span>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={download}>
          <Download /> Download
        </Button>
      </div>
      <div className="grid min-h-0 flex-1 place-items-center overflow-auto bg-[conic-gradient(var(--muted)_25%,transparent_0_50%,var(--muted)_0_75%,transparent_0)] bg-size-[16px_16px] p-6">
        <img
          src={imageSource(content)}
          alt="Response preview"
          onLoad={(e) =>
            setSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })
          }
          className="max-h-full max-w-full rounded-sm object-contain shadow-sm"
        />
      </div>
    </div>
  )
}
