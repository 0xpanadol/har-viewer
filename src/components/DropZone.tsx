import { useState, useCallback, useEffect } from 'react'

interface Props {
  onFileDrop: (file: File) => void
}

export function DropZone({ onFileDrop }: Props) {
  const [active, setActive] = useState(false)
  const [dragover, setDragover] = useState(false)
  const dragCounterRef = { current: 0 }

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    setActive(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current <= 0) {
      setActive(false)
      setDragover(false)
      dragCounterRef.current = 0
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragover(true)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      dragCounterRef.current = 0
      setActive(false)
      setDragover(false)
      const file = e.dataTransfer?.files?.[0]
      if (file) onFileDrop(file)
    },
    [onFileDrop]
  )

  useEffect(() => {
    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)
    return () => {
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('drop', handleDrop)
    }
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop])

  if (!active) return null

  return (
    <div id="drop-zone" className={`active ${dragover ? 'dragover' : ''}`}>
      <div className="drop-inner">
        <div className="drop-icon">📦</div>
        <div className="drop-title">Drop HAR file here</div>
        <div className="drop-sub">Supports .har and .json files of any size</div>
      </div>
    </div>
  )
}
