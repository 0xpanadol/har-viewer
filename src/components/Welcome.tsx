interface Props {
  onOpenFile: () => void
}

export function Welcome({ onOpenFile }: Props) {
  return (
    <div id="welcome">
      <div className="welcome-icon">🔍</div>
      <div className="welcome-title">HAR Viewer</div>
      <div className="welcome-sub">
        Drop a .har file anywhere on this page, or click below to browse.
        Handles files of any size with streaming parsing and virtual scrolling.
      </div>
      <button className="welcome-btn" onClick={onOpenFile}>
        Open HAR File
      </button>
      <div className="welcome-hint">or drag &amp; drop anywhere</div>
    </div>
  )
}
