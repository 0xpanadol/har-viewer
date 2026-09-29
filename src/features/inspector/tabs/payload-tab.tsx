import { Send } from 'lucide-react'
import { KeyValueList } from '@/components/key-value-list'
import { Section } from '@/components/section'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import type { Entry } from '@/har/types'
import { formatBytes } from '@/lib/format'
import { PayloadBody } from './payload-body'

export function PayloadTab({ entry }: { entry: Entry }) {
  const postData = entry.raw.request?.postData
  if (!postData || (!postData.text && !postData.params?.length)) {
    return (
      <EmptyState
        icon={<Send />}
        title="No request body"
        description={`This ${entry.method} request was sent without a payload.`}
      />
    )
  }

  const size = postData.text?.length ?? 0
  return (
    <>
      <div className="flex items-center gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
        <Badge tone="outline" size="md" className="font-mono">
          {postData.mimeType || 'unknown type'}
        </Badge>
        {size > 0 && <span className="tabular">{formatBytes(size)}</span>}
      </div>
      {postData.params && postData.params.length > 0 && (
        <Section title="Form fields" count={postData.params.length}>
          <KeyValueList
            items={postData.params.map((p) => ({
              name: p.name,
              value: p.fileName ? `📎 ${p.fileName}` : p.value,
            }))}
            decode
          />
        </Section>
      )}
      {postData.text && <PayloadBody text={postData.text} mimeType={postData.mimeType ?? ''} />}
    </>
  )
}
