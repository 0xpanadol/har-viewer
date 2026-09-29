import { useEffect } from 'react'
import { encodeCriteria } from '@/services/url-state'
import { useCriteria } from '@/store/selectors'

/** Keeps the URL hash in sync with the active filters so the current view can be shared. */
export function useUrlHashSync(enabled: boolean): void {
  const criteria = useCriteria()
  useEffect(() => {
    if (!enabled) return
    const encoded = encodeCriteria(criteria)
    const url = `${window.location.pathname}${window.location.search}${encoded ? `#${encoded}` : ''}`
    window.history.replaceState(null, '', url)
  }, [criteria, enabled])
}
