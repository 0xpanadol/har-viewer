export const HAR_ACCEPT = '.har,.json,application/json'

/** Opens the native file dialog without a mounted <input>. Resolves null when cancelled. */
export function pickFile(accept = HAR_ACCEPT): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true })
    input.addEventListener('cancel', () => resolve(null), { once: true })
    input.click()
  })
}
