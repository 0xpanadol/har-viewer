import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

/** Label for the primary modifier: ⌘ on Apple platforms, Ctrl elsewhere. */
export const MOD = isMac ? '⌘' : 'Ctrl'

export function isModKey(event: KeyboardEvent | ReactKeyboardEvent): boolean {
  return isMac ? event.metaKey : event.ctrlKey
}

/** True when keystrokes belong to a text field rather than to app shortcuts. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** Any Radix dialog, menu or popover currently open — single-key shortcuts pause while one is. */
export function isOverlayOpen(): boolean {
  return (
    document.querySelector(
      '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [role="menu"][data-state="open"]',
    ) !== null
  )
}
