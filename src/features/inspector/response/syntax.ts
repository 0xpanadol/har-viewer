export type Language = 'json' | 'html' | 'xml' | 'css' | 'js' | 'text'

export interface Token {
  text: string
  className?: string
}

export function detectLanguage(mimeType: string, text: string): Language {
  const mime = mimeType.toLowerCase()
  if (mime.includes('json')) return 'json'
  if (mime.includes('html')) return 'html'
  if (mime.includes('xml') || mime.includes('svg')) return 'xml'
  if (mime.includes('css')) return 'css'
  if (mime.includes('javascript') || mime.includes('ecmascript')) return 'js'
  const head = text.trimStart().slice(0, 1)
  if (head === '{' || head === '[') return 'json'
  if (head === '<') return 'html'
  return 'text'
}

const CLASS = {
  key: 'text-syntax-key',
  string: 'text-syntax-string',
  number: 'text-syntax-number',
  literal: 'text-syntax-literal',
  tag: 'text-syntax-tag',
  attr: 'text-syntax-attr',
  comment: 'text-syntax-comment italic',
  punct: 'text-subtle-foreground',
}

const JSON_TOKEN = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|\b(true|false|null)\b/g
const MARKUP_TOKEN = /(<!--.*?-->)|(<\/?[\w:.-]+)|([\w:.-]+)(=)("[^"]*"|'[^']*')|(\/?>)/g
const CODE_TOKEN =
  /(\/\*.*?\*\/|\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(\d+(?:\.\d+)?)\b|\b(const|let|var|function|return|if|else|for|while|import|export|from|new|class|async|await|true|false|null|undefined|this|@media|@import|!important)\b/g

function scan(line: string, pattern: RegExp, classify: (m: RegExpExecArray) => Token[]): Token[] {
  const tokens: Token[] = []
  let cursor = 0
  pattern.lastIndex = 0
  for (let m = pattern.exec(line); m; m = pattern.exec(line)) {
    if (m[0] === '') {
      pattern.lastIndex++
      continue
    }
    if (m.index > cursor) tokens.push({ text: line.slice(cursor, m.index) })
    tokens.push(...classify(m))
    cursor = m.index + m[0].length
  }
  if (cursor < line.length) tokens.push({ text: line.slice(cursor) })
  return tokens
}

/** Lightweight single-line highlighter — enough to make captures scannable, not a full grammar. */
export function tokenizeLine(line: string, language: Language): Token[] {
  switch (language) {
    case 'json':
      return scan(line, JSON_TOKEN, (m) => {
        if (m[1] !== undefined) {
          return m[2]
            ? [
                { text: m[1], className: CLASS.key },
                { text: m[2], className: CLASS.punct },
              ]
            : [{ text: m[1], className: CLASS.string }]
        }
        if (m[3] !== undefined) return [{ text: m[3], className: CLASS.number }]
        return [{ text: m[0], className: CLASS.literal }]
      })
    case 'html':
    case 'xml':
      return scan(line, MARKUP_TOKEN, (m) => {
        if (m[1]) return [{ text: m[1], className: CLASS.comment }]
        if (m[2]) return [{ text: m[2], className: CLASS.tag }]
        if (m[3])
          return [
            { text: m[3], className: CLASS.attr },
            { text: m[4]!, className: CLASS.punct },
            { text: m[5]!, className: CLASS.string },
          ]
        return [{ text: m[0], className: CLASS.tag }]
      })
    case 'css':
    case 'js':
      return scan(line, CODE_TOKEN, (m) => {
        if (m[1]) return [{ text: m[1], className: CLASS.comment }]
        if (m[2]) return [{ text: m[2], className: CLASS.string }]
        if (m[3]) return [{ text: m[3], className: CLASS.number }]
        return [{ text: m[0], className: CLASS.literal }]
      })
    default:
      return [{ text: line }]
  }
}

export const syntaxClass = CLASS
