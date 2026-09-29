import type { InspectorTab } from '@/har/search'
import type { Entry } from '@/har/types'

export interface TabDefinition {
  id: InspectorTab
  label: string
  count?: number
  /** Content exists but has no meaningful count (e.g. a request body). */
  dot?: boolean
}

export function inspectorTabs(entry: Entry): TabDefinition[] {
  const { request, response, _webSocketMessages: messages } = entry.raw
  const headerCount = (request?.headers?.length ?? 0) + (response?.headers?.length ?? 0)
  const cookieCount = (request?.cookies?.length ?? 0) + (response?.cookies?.length ?? 0)
  const tabs: TabDefinition[] = [
    { id: 'headers', label: 'Headers', count: headerCount },
    {
      id: 'payload',
      label: 'Payload',
      dot: Boolean(request?.postData?.text || request?.postData?.params?.length),
    },
    { id: 'response', label: 'Response', dot: Boolean(response?.content?.text) },
    { id: 'cookies', label: 'Cookies', count: cookieCount || undefined },
    { id: 'timing', label: 'Timing' },
  ]
  if (messages?.length) tabs.push({ id: 'websocket', label: 'Messages', count: messages.length })
  tabs.push({ id: 'raw', label: 'Raw' })
  return tabs
}

export const TAB_ORDER: InspectorTab[] = [
  'headers',
  'payload',
  'response',
  'cookies',
  'timing',
  'websocket',
  'raw',
]
