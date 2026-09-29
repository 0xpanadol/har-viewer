const PRINTABLE = /^[\x20-\x7E\r\n\t]+$/
const BASE64_TOKEN = /^[A-Za-z0-9+/=_-]{20,}$/

export function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

export function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

export function tryDecodeBase64(text: string): string | null {
  try {
    return atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  } catch {
    return null
  }
}

export function base64ToBytes(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * Returns a human-readable decoding of an opaque value (URL-encoded or base64/JSON),
 * or null when the value is already readable.
 */
export function decodeHint(value: string): { kind: 'url' | 'base64'; text: string } | null {
  if (!value) return null
  try {
    const decoded = decodeURIComponent(value.replace(/\+/g, ' '))
    if (decoded !== value && decoded !== value.replace(/\+/g, ' ')) return { kind: 'url', text: decoded }
  } catch {
    /* malformed escape sequences — fall through to base64 */
  }
  if (BASE64_TOKEN.test(value)) {
    const decoded = tryDecodeBase64(value)
    if (decoded && PRINTABLE.test(decoded.slice(0, 120))) {
      const json = tryParseJson(decoded)
      return { kind: 'base64', text: json === undefined ? decoded : JSON.stringify(json) }
    }
  }
  return null
}

/** Decodes a response body honoring `encoding: base64`. */
export function responseText(content: { text?: string; encoding?: string } | undefined): string {
  if (!content?.text) return ''
  if (content.encoding !== 'base64') return content.text
  const decoded = tryDecodeBase64(content.text)
  if (decoded === null) return content.text
  try {
    return new TextDecoder().decode(base64ToBytes(content.text))
  } catch {
    return decoded
  }
}
