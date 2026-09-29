import type { Entry } from './types'

export type PhaseKey = 'blocked' | 'dns' | 'connect' | 'ssl' | 'send' | 'wait' | 'receive'

export interface Phase {
  key: PhaseKey
  label: string
  description: string
  /** Tailwind background utility backed by a validated chart token. */
  swatch: string
}

export const PHASES: readonly Phase[] = [
  {
    key: 'blocked',
    label: 'Queued',
    description: 'Waiting for a connection or queued by the browser',
    swatch: 'bg-phase-blocked',
  },
  { key: 'dns', label: 'DNS', description: 'Resolving the host name', swatch: 'bg-phase-dns' },
  {
    key: 'connect',
    label: 'Connect',
    description: 'Establishing the TCP connection',
    swatch: 'bg-phase-connect',
  },
  { key: 'ssl', label: 'TLS', description: 'Negotiating the TLS handshake', swatch: 'bg-phase-ssl' },
  { key: 'send', label: 'Send', description: 'Sending the request', swatch: 'bg-phase-send' },
  {
    key: 'wait',
    label: 'Waiting (TTFB)',
    description: 'Waiting for the first byte from the server',
    swatch: 'bg-phase-wait',
  },
  {
    key: 'receive',
    label: 'Download',
    description: 'Receiving the response body',
    swatch: 'bg-phase-receive',
  },
]

export interface PhaseSegment extends Phase {
  duration: number
  /** Offset from the start of the request, in ms. */
  offset: number
}

/**
 * Positive phases laid end to end. Note: per spec `connect` includes `ssl`, so ssl is
 * subtracted from connect to keep the segments additive.
 */
export function phaseSegments(entry: Pick<Entry, 'timings'>): PhaseSegment[] {
  const t = entry.timings
  const ssl = Math.max(0, t.ssl)
  const values: Record<PhaseKey, number> = {
    blocked: Math.max(0, t.blocked),
    dns: Math.max(0, t.dns),
    connect: Math.max(0, t.connect - ssl),
    ssl,
    send: Math.max(0, t.send),
    wait: Math.max(0, t.wait),
    receive: Math.max(0, t.receive),
  }
  let offset = 0
  const segments: PhaseSegment[] = []
  for (const phase of PHASES) {
    const duration = values[phase.key]
    if (duration > 0) segments.push({ ...phase, duration, offset })
    offset += duration
  }
  return segments
}
