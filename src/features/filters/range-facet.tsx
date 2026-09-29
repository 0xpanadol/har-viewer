import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/cn'

interface RangeFacetProps {
  min: number | null
  max: number | null
  onChange: (min: number | null, max: number | null) => void
  parse: (input: string) => number | null
  format: (value: number) => string
  presets: ReadonlyArray<{ label: string; min: number }>
  placeholder: [string, string]
}

/** Min/max pair that commits on blur/Enter, plus one-click "at least" presets. */
export function RangeFacet({ min, max, onChange, parse, format, presets, placeholder }: RangeFacetProps) {
  return (
    <div className="flex flex-col gap-2 px-1.5 pb-1">
      <div className="flex items-center gap-1.5">
        <BoundInput
          key={`min-${min}`}
          value={min}
          format={format}
          parse={parse}
          placeholder={placeholder[0]}
          onCommit={(v) => onChange(v, max)}
        />
        <span className="text-subtle-foreground">–</span>
        <BoundInput
          key={`max-${max}`}
          value={max}
          format={format}
          parse={parse}
          placeholder={placeholder[1]}
          onCommit={(v) => onChange(min, v)}
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => {
          const active = min === p.min && max === null
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => (active ? onChange(null, null) : onChange(p.min, null))}
              className={cn(
                'h-6 rounded-md border px-2 text-2xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                active
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface BoundInputProps {
  value: number | null
  format: (v: number) => string
  parse: (input: string) => number | null
  placeholder: string
  onCommit: (value: number | null) => void
}

function BoundInput({ value, format, parse, placeholder, onCommit }: BoundInputProps) {
  const [draft, setDraft] = useState(value === null ? '' : format(value))
  const parsed = draft.trim() === '' ? null : parse(draft)
  const invalid = draft.trim() !== '' && parsed === null
  const commit = () => {
    if (!invalid && parsed !== value) onCommit(parsed)
  }
  return (
    <Input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
      placeholder={placeholder}
      aria-invalid={invalid}
      className="h-7 px-2 font-mono text-xs"
    />
  )
}
