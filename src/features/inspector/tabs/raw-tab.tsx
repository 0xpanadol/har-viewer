import { Copy } from 'lucide-react'
import { CodeBlock } from '@/components/code-block'
import { Button } from '@/components/ui/button'
import type { Entry } from '@/har/types'
import { copyText } from '@/lib/clipboard'
import { formatBytes } from '@/lib/format'

const PREVIEW_BODY_CHARS = 2000

/** The entry exactly as it appears in the HAR, with long bodies shortened for display. */
export function RawTab({ entry }: { entry: Entry }) {
  const display = structuredClone(entry.raw)
  const text = display.response?.content?.text
  if (text && text.length > PREVIEW_BODY_CHARS) {
    display.response.content.text = `${text.slice(0, PREVIEW_BODY_CHARS)}… [${formatBytes(text.length)} — truncated for display]`
  }

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between px-3">
        <p className="text-xs text-muted-foreground">HAR entry JSON</p>
        <Button size="xs" onClick={() => copyText(JSON.stringify(entry.raw, null, 2), 'Entry JSON copied')}>
          <Copy /> Copy full JSON
        </Button>
      </div>
      <CodeBlock content={JSON.stringify(display, null, 2)} className="[&_pre]:max-h-none" />
    </div>
  )
}
