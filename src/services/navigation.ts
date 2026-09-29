import { useAppStore } from '@/store'
import { selectVisibleEntries } from '@/store/selectors'

export type Step = number | 'first' | 'last'

/** Moves the selection through the visible rows (keyboard + inspector prev/next). */
export function moveSelection(step: Step): void {
  const state = useAppStore.getState()
  const visible = selectVisibleEntries(state)
  if (!visible.length) return
  const current = visible.findIndex((e) => e.id === state.selectedId)
  let next: number
  if (step === 'first') next = 0
  else if (step === 'last') next = visible.length - 1
  else if (current === -1) next = step > 0 ? 0 : visible.length - 1
  else next = Math.min(visible.length - 1, Math.max(0, current + step))
  state.select(visible[next]!.id)
}
