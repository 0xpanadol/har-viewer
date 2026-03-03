import { useCallback, useRef, useEffect } from 'react'
import { useHarStore } from '../store/harStore'

export function ResizeHandle() {
  const detailPanelOpen = useHarStore((s) => s.detailPanelOpen)
  const detailPanelWidth = useHarStore((s) => s.detailPanelWidth)
  const setDetailPanelWidth = useHarStore((s) => s.setDetailPanelWidth)
  const resizingRef = useRef(false)
  const startXRef = useRef(0)
  const startWRef = useRef(0)
  const handleRef = useRef<HTMLDivElement>(null)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      resizingRef.current = true
      startXRef.current = e.clientX
      startWRef.current = detailPanelWidth
      handleRef.current?.classList.add('active')
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [detailPanelWidth]
  )

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return
      const dx = startXRef.current - e.clientX
      const newW = Math.max(320, Math.min(window.innerWidth * 0.6, startWRef.current + dx))
      setDetailPanelWidth(newW)
    }

    const onMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = false
        handleRef.current?.classList.remove('active')
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
  }, [setDetailPanelWidth])

  if (!detailPanelOpen) return null

  return <div className="resize-handle" ref={handleRef} onMouseDown={onMouseDown} />
}
