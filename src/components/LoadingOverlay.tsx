interface Props {
  visible: boolean
  text: string
  progress: number
}

export function LoadingOverlay({ visible, text, progress }: Props) {
  if (!visible) return null

  return (
    <div id="loading" className="active">
      <div className="loader" />
      <div className="load-text">{text}</div>
      <div className="load-progress">
        <div className="load-progress-bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
