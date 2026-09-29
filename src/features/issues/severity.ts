import { CircleAlert, Info, OctagonAlert, type LucideIcon } from 'lucide-react'
import type { IssueSeverity } from '@/har/issues'

export const SEVERITY: Record<IssueSeverity, { label: string; icon: LucideIcon; tone: string }> = {
  critical: { label: 'Critical', icon: OctagonAlert, tone: 'text-danger' },
  warning: { label: 'Warning', icon: CircleAlert, tone: 'text-warning' },
  info: { label: 'Info', icon: Info, tone: 'text-info' },
}
