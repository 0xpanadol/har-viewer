import { useState } from 'react'

interface Props {
  title: string
  badge?: number
  defaultOpen?: boolean
  titleExtra?: React.ReactNode
  children: React.ReactNode
}

export function Section({ title, badge, defaultOpen = true, titleExtra, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="section">
      <div className="section-title collapsible" onClick={() => setOpen(!open)}>
        <span className={`chevron ${open ? 'open' : ''}`}>▶</span>
        {title} {badge !== undefined && <span className="badge">{badge}</span>}
        {titleExtra && <span style={{ marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}>{titleExtra}</span>}
      </div>
      {open && children}
    </div>
  )
}
