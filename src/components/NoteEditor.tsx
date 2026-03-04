import { useState, useEffect, useRef } from 'react'

interface Props {
  entryLabel?: string
  initialText: string
  onSave: (text: string) => void
  onDelete: () => void
  onClose: () => void
}

export function NoteEditor({ entryLabel, initialText, onSave, onDelete, onClose }: Props) {
  const [text, setText] = useState(initialText)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTimeout(() => {
      textareaRef.current?.focus()
      if (initialText) textareaRef.current?.select()
    }, 50)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (text.trim()) onSave(text.trim())
        else onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [text, onSave, onClose])

  return (
    <div className="note-backdrop" onClick={onClose}>
      <div className="note-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Edit note">
        <div className="note-modal-header">
          <span className="note-modal-title">📝 {initialText ? 'Edit Note' : 'Add Note'}</span>
          <button className="note-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {entryLabel && (
          <div className="note-entry-label" title={entryLabel}>{entryLabel}</div>
        )}
        <textarea
          ref={textareaRef}
          className="note-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a note about this request..."
          rows={5}
        />
        <div className="note-modal-footer">
          <span className="note-hint">⌘/Ctrl + Enter to save</span>
          <div className="note-actions">
            {initialText && (
              <button className="note-btn delete" onClick={onDelete}>Delete</button>
            )}
            <button className="note-btn cancel" onClick={onClose}>Cancel</button>
            <button className="note-btn save" onClick={() => { if (text.trim()) onSave(text.trim()); else onClose() }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
