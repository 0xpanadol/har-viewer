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
  transferSize: number
  time: number
  startTime: number
  timings: HarTimings
  initiator: string
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

export type OverlayPanel = 'none' | 'stats' | 'issues' | 'diff' | 'perf' | 'grouping' | 'timeline' | 'compare' | 'initiator' | 'shortcuts' | 'waterfall'

export type SearchScope = 'url' | 'body' | 'headers' | 'all'

export type Theme = 'dark' | 'light'

// Filter presets
export interface FilterPreset {
  id: string
  name: string
  searchQuery: string
  useRegex: boolean
  negateSearch: boolean
  activeMethodFilters: string[]
  activeStatusFilters: string[]
  activeTypeFilters: string[]
  activeDomainFilters: string[]
  minTime: number | null
  maxTime: number | null
  minSize: number | null
  maxSize: number | null
}

// HAR validation
export interface ValidationWarning {
  idx: number
  type: 'error' | 'warning'
  message: string
}

// Annotations
export interface Annotation {
  entryIdx: number
  text: string
  createdAt: number
}

// Grouping
export type GroupBy = 'domain' | 'type' | 'status'

// Search match locations
export interface SearchMatchLocation {
  url: boolean
  headers: boolean
  requestBody: boolean
  responseBody: boolean
  cookies: boolean
}

// Search match locations
export interface SearchMatchLocation {
  url: boolean
  headers: boolean
  requestBody: boolean
  responseBody: boolean
  cookies: boolean
}

