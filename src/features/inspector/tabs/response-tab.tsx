import { FileX } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { responseText } from '@/har/decode'
import type { Entry } from '@/har/types'
import { ImagePreview } from '../response/image-preview'
import { ResponseViewer } from '../response/response-viewer'
import { detectLanguage } from '../response/syntax'

export function ResponseTab({ entry }: { entry: Entry }) {
  const content = entry.raw.response?.content
  if (!content?.text) {
    return (
      <EmptyState
        icon={<FileX />}
        title="No response body captured"
        description="The capture doesn’t include this body. In Chrome DevTools use “Save all as HAR (with content)” to keep bodies."
      />
    )
  }

  const mime = content.mimeType ?? ''
  if (/^image\//i.test(mime)) return <ImagePreview content={content} />

  const text = responseText(content)
  return (
    <ResponseViewer
      key={entry.id}
      text={text}
      language={detectLanguage(mime, text)}
      mimeType={mime}
      size={content.size}
    />
  )
}
