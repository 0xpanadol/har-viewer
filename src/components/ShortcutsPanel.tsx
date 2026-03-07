import { ResizableOverlay } from './ResizableOverlay'
import { useHarStore } from '../store/harStore'

const shortcuts = [
  { keys: 'Ctrl + F', desc: 'Search / filter entries (or search in detail panel)' },
  { keys: 'Ctrl + S', desc: 'Save current state' },
  { keys: 'Ctrl + Z', desc: 'Undo last delete' },
  { keys: '?', desc: 'Toggle keyboard shortcuts panel' },
  { keys: '↑ / ↓', desc: 'Navigate entries' },
  { keys: 'Escape', desc: 'Close detail panel / deselect' },
  { keys: 'Delete', desc: 'Delete selected entry' },
  { keys: 'Shift + Click', desc: 'Range select entries (checkboxes)' },
  { keys: 'Click checkbox', desc: 'Toggle single entry selection' },
]

export function ShortcutsPanel() {
  const setOverlayPanel = useHarStore((s) => s.setOverlayPanel)

  return (
    <ResizableOverlay initialWidth={400}>
      <div className="overlay-header">
        <span className="overlay-title">Keyboard Shortcuts</span>
        <button className="detail-close" onClick={() => setOverlayPanel('none')}>✕</button>
      </div>
      <div className="overlay-body">
        <div className="shortcuts-list" role="list" aria-label="Keyboard shortcuts">
          {shortcuts.map((s, i) => (
            <div key={i} className="shortcut-row" role="listitem">
              <kbd className="shortcut-keys">{s.keys}</kbd>
              <span className="shortcut-desc">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </ResizableOverlay>
  )
}
