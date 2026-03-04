import { useRef, useCallback, useState, useEffect } from 'react'

interface Props {
  initialWidth?: number
  minWidth?: number
  maxWidth?: number
  className?: string
  children: React.ReactNode
}

export function ResizableOverlay({ initialWidth = 420, minWidth = 300, maxWidth, className = '', children }: Props) {
  const [width, setWidth] = useState(initialWidth)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  const effectiveMax = maxWidth || Math.floor(window.innerWidth * 0.9)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startW.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const delta = startX.current - e.clientX
      const newW = Math.min(effectiveMax, Math.max(minWidth, startW.current + delta))
      setWidth(newW)
    }
    const onMouseUp = () => {
      if (dragging.current) {
        dragging.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [minWidth, effectiveMax])

  return (
    <div className={`overlay-panel ${className}`} style={{ width }}>
      <div className="overlay-resize-handle" onMouseDown={onMouseDown} />
      {children}
    </div>
  )
}
