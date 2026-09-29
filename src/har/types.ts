/* ─── HAR 1.2 spec (http://www.softwareishard.com/blog/har-12-spec/) ─── */

export interface HarFile {
  log: HarLog
}

export interface HarLog {
  version?: string
  creator?: { name: string; version: string }
  pages?: HarPage[]
  entries: HarEntry[]
}

export interface HarPage {
  id?: string
  title?: string
  startedDateTime?: string
  pageTimings?: { onContentLoad?: number; onLoad?: number }
}

export interface HarEntry {
  startedDateTime: string
  time: number
  request: HarRequest
  response: HarResponse
  timings: HarTimings
  serverIPAddress?: string
  connection?: string
  pageref?: string
  cache?: Record<string, unknown>
  _initiator?: { type?: string; url?: string; lineNumber?: number }
  _webSocketMessages?: WebSocketMessage[]
}

export interface WebSocketMessage {
  type: 'send' | 'receive'
  time: number
  opcode: number
  data: string
}

export interface HarRequest {
  method: string
  url: string
  httpVersion: string
  headers: HarNameValue[]
  queryString: HarNameValue[]
  cookies: HarCookie[]
  postData?: HarPostData
  headersSize: number
  bodySize: number
}

export interface HarResponse {
  status: number
  statusText: string
  httpVersion: string
  headers: HarNameValue[]
  cookies: HarCookie[]
  content: HarContent
  redirectURL: string
  headersSize: number
  bodySize: number
}

export interface HarNameValue {
  name: string
  value: string
}

export interface HarCookie {
  name: string
  value: string
  path?: string
  domain?: string
  expires?: string
  httpOnly?: boolean
  secure?: boolean
  sameSite?: string
}

export interface HarPostData {
  mimeType: string
  text?: string
  params?: Array<HarNameValue & { fileName?: string; contentType?: string }>
}

export interface HarContent {
  size: number
  compression?: number
  mimeType: string
  text?: string
  encoding?: string
}

export interface HarTimings {
  blocked?: number
  dns?: number
  connect?: number
  ssl?: number
  send: number
  wait: number
  receive: number
}

/* ─── Normalized model ─── */

/** A HAR entry flattened into the fields the UI filters, sorts and renders on. */
export interface Entry {
  /** Stable for the lifetime of a capture — survives deletions and session restores. */
  id: number
  raw: HarEntry
  method: string
  url: string
  host: string
  path: string
  status: number
  statusText: string
  /** Short resource type label: json, js, css, html, img, font… */
  type: string
  /** Decoded content size in bytes, or -1 when unknown. */
  size: number
  /** Bytes on the wire, or -1 when unknown. */
  transferSize: number
  time: number
  startTime: number
  timings: Required<HarTimings>
  initiator: string
  httpVersion: string
}

export type StatusGroup = '1xx' | '2xx' | '3xx' | '4xx' | '5xx' | 'failed'

export interface ValidationIssue {
  /** Entry id, or null for log-level problems. */
  entryId: number | null
  level: 'error' | 'warning'
  message: string
}

export interface CaptureRange {
  start: number
  end: number
}
