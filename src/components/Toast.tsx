import { useState, useEffect, useCallback } from 'react'

interface ToastItem {
  id: number
  message: string
}

let _addToast: (msg: string) => void = () => {}
let _nextId = 0

/** Call from anywhere to show a brief toast */
export function showToast(message: string) {
  _addToast(message)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const add = useCallback((message: string) => {
    const id = _nextId++
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 1800)
  }, [])

  useEffect(() => {
    _addToast = add
    return () => { _addToast = () => {} }
  }, [add])

  if (toasts.length === 0) return null

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast-item">{t.message}</div>
      ))}
    </div>
  )
}
