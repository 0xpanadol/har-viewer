import { highlight, useFindQuery } from './find-query'

/** Text with the active find query marked. */
export function Highlight({ text }: { text: string }) {
  return highlight(text, useFindQuery())
}
