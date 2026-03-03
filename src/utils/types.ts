// HAR spec types
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
  _pinned?: boolean
}

export interface HarRequest {
  method: string
  url: string
  httpVersion: string
  headers: HarHeader[]
  queryString: HarParam[]
  cookies: HarCookie[]
  postData?: HarPostData
  headersSize: number
  bodySize: number
}

export interface HarResponse {
  status: number
  statusText: string
  httpVersion: string
  headers: HarHeader[]
  cookies: HarCookie[]
  content: HarContent
  redirectURL: string
  headersSize: number
  bodySize: number
}

export interface HarHeader {
  name: string
  value: string
}

export interface HarParam {
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
  params?: HarParam[]
}

export interface HarContent {
  size: number
  compression?: number
  mimeType: string
  text?: string
  encoding?: string
}

export interface HarTimings {
  blocked: number
  dns: number
  connect: number
  ssl: number
  send: number
  wait: number
  receive: number
}

// App types
export interface ParsedEntry {
  _idx: number
  _raw: HarEntry
  method: string
  url: string
  host: string
  path: string
  status: number
  statusText: string
  contentType: string
  size: number
  time: number
  startTime: number
  timings: HarTimings
}

export type SortColumn = 'none' | 'method' | 'url' | 'status' | 'type' | 'size' | 'time'
export type SortDirection = 'asc' | 'desc'
export type DetailTab = 'headers' | 'payload' | 'response' | 'cookies' | 'timing' | 'raw'

export interface VisibleColumns {
  method: boolean
  url: boolean
  status: boolean
  type: boolean
  size: boolean
  time: boolean
  waterfall: boolean
}

export const DEFAULT_VISIBLE_COLUMNS: VisibleColumns = {
  method: true,
  url: true,
  status: true,
  type: true,
  size: true,
  time: true,
  waterfall: true,
}

export type OverlayPanel = 'none' | 'stats' | 'issues' | 'diff'
