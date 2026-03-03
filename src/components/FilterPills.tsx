interface PillData {
  label: string
  count: number
  active: boolean
}

interface Props {
  pills: PillData[]
  onToggle: (label: string) => void
  dataAttr?: string
}

export function FilterPills({ pills, onToggle, dataAttr }: Props) {
  return (
    <div className="filter-pills">
      {pills.map((p) => (
        <button
          key={p.label}
          className={`pill ${p.active ? 'active' : ''}`}
          {...(dataAttr ? { [`data-${dataAttr}`]: p.label } : {})}
          onClick={() => onToggle(p.label)}
        >
          {p.label} <span className="count">{p.count}</span>
        </button>
      ))}
    </div>
  )
}
