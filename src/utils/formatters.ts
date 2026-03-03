export function formatBytes(b: number): string {
  if (b < 0) return '—'
  if (b === 0) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), 3)
  return (b / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + u[i]
}

export function formatTime(ms: number): string {
  if (ms < 0) return '—'
  if (ms < 1) return '<1ms'
  if (ms < 1000) return Math.round(ms) + 'ms'
  if (ms < 60000) return (ms / 1000).toFixed(2) + 's'
  return (ms / 60000).toFixed(1) + 'm'
}

export function timeClass(ms: number): string {
  if (ms < 300) return 'time-fast'
  if (ms < 1000) return 'time-med'
  return 'time-slow'
}

export function statusClass(s: number): string {
  if (s < 200) return 'status-1xx'
  if (s < 300) return 'status-2xx'
  if (s < 400) return 'status-3xx'
  if (s < 500) return 'status-4xx'
  return 'status-5xx'
}

export function escHtml(s: string): string {
  const d = document.createElement('div')
  d.textContent = s
  return d.innerHTML
}
