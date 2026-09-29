import type { HarLog, ValidationIssue } from './types'

/** Structural sanity checks run on load; surfaced in the file menu, never blocking. */
export function validateHar(log: HarLog): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const push = (entryId: number | null, level: ValidationIssue['level'], message: string) =>
    issues.push({ entryId, level, message })

  if (!log.version) push(null, 'warning', 'Missing HAR version field')
  if (!log.creator) push(null, 'warning', 'Missing HAR creator field')

  log.entries.forEach((e, i) => {
    if (!e.request?.url) push(i, 'error', 'Missing request URL')
    if (!e.request?.method) push(i, 'warning', 'Missing request method')
    if (!e.startedDateTime) push(i, 'warning', 'Missing startedDateTime')
    if (!e.timings) push(i, 'warning', 'Missing timings data')
    if (e.time !== undefined && e.time < 0) push(i, 'warning', `Negative time: ${e.time}`)
    if (e.response?.bodySize !== undefined && e.response.bodySize < -1) {
      push(i, 'warning', `Negative body size: ${e.response.bodySize}`)
    }
    if (e.response?.content?.size !== undefined && e.response.content.size < -1) {
      push(i, 'warning', `Negative content size: ${e.response.content.size}`)
    }
    if (e.response?.status === 0 && !e.response.statusText) {
      push(i, 'warning', 'Status 0 — request was blocked, aborted or never completed')
    }
  })

  return issues
}
