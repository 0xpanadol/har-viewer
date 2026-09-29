import { Check, Minus } from 'lucide-react'
import { Checkbox as Primitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export function Checkbox({ className, ...props }: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={cn(
        'peer grid size-3.5 shrink-0 place-items-center rounded-[4px] border border-border-strong bg-background transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
        className,
      )}
      {...props}
    >
      <Primitive.Indicator className="group grid place-items-center">
        <Check className="hidden size-3 stroke-3 group-data-[state=checked]:block" />
        <Minus className="hidden size-3 stroke-3 group-data-[state=indeterminate]:block" />
      </Primitive.Indicator>
    </Primitive.Root>
  )
}
