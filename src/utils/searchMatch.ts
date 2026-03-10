import type { ParsedEntry, SearchMatchLocation, DetailTab } from './types'

/**
 * Compute where a search query matches within a single entry.
 */
export function getSearchMatchLocations(entry: ParsedEntry, query: string, useRegex: boolean): SearchMatchLocation {
  const result: SearchMatchLocation = { url: false, headers: false, requestBody: false, responseBody: false, cookies: false }
  if (!query || query.length < 2) return result

  let regex: RegExp | null = null
  let plainQ = ''
  if (useRegex) {
    try { regex = new RegExp(query, 'i') } catch { /* invalid */ }
  }
  if (!regex) plainQ = query.toLowerCase()

  const test = (haystack: string): boolean => {
    if (regex) return regex.test(haystack)
    return haystack.toLowerCase().includes(plainQ)
  }

  // URL area
  const urlHaystack = `${entry.method} ${entry.url} ${entry.status} ${entry.statusText} ${entry.contentType}`
  result.url = test(urlHaystack)

  // Headers
  const reqHeaders = (entry._raw.request?.headers || []).map((h) => `${h.name}: ${h.value}`).join(' ')
  const resHeaders = (entry._raw.response?.headers || []).map((h) => `${h.name}: ${h.value}`).join(' ')
  result.headers = test(`${reqHeaders} ${resHeaders}`)

  // Request body
  const reqBody = entry._raw.request?.postData?.text || ''
  const reqParams = (entry._raw.request?.postData?.params || []).map((p) => `${p.name} ${p.value}`).join(' ')
  result.requestBody = test(`${reqBody} ${reqParams}`)

  // Response body
  const resBody = entry._raw.response?.content?.text || ''
  result.responseBody = test(resBody)

  // Cookies
  const reqCookies = (entry._raw.request?.cookies || []).map((c) => `${c.name} ${c.value}`).join(' ')
  const resCookies = (entry._raw.response?.cookies || []).map((c) => `${c.name} ${c.value}`).join(' ')
  result.cookies = test(`${reqCookies} ${resCookies}`)

  return result
}

/**
 * Determine the best tab to auto-open based on where the search matched.
 * Priority: responseBody > requestBody > headers > cookies
 */
export function getBestTabForMatch(loc: SearchMatchLocation): DetailTab | null {
  if (loc.responseBody) return 'response'
  if (loc.requestBody) return 'payload'
  if (loc.headers) return 'headers'
  if (loc.cookies) return 'cookies'
  return null
}

/**
 * Count total text matches in a string.
 */
export function countMatches(text: string, query: string): number {
  if (!query || query.length < 2) return 0
  const q = query.toLowerCase()
  const lower = text.toLowerCase()
  let count = 0
  let pos = 0
  while (pos < lower.length) {
    const idx = lower.indexOf(q, pos)
    if (idx === -1) break
    count++
    pos = idx + 1
  }
  return count
}
