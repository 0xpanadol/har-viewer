import { Tabs as Primitive, ToggleGroup, Toggle as TogglePrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export const Tabs = Primitive.Root

/** Underline tabs — primary navigation within a surface. */
export function TabsList({ className, ...props }: ComponentProps<typeof Primitive.List>) {
  return (
    <Primitive.List
      className={cn('scrollbar-none flex h-10 shrink-0 items-stretch gap-4 overflow-x-auto', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      className={cn(
        'relative inline-flex shrink-0 cursor-default items-center gap-1.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none select-none hover:text-foreground focus-visible:text-foreground data-[state=active]:text-foreground',
        'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent data-[state=active]:after:bg-foreground',
        className,
      )}
      {...props}
    />
  )
}

export const TabsContent = Primitive.Content

/** Compact single-select control (e.g. scope pickers). */
export function SegmentedControl({ className, ...props }: ComponentProps<typeof ToggleGroup.Root>) {
  return (
    <ToggleGroup.Root
      className={cn('inline-flex h-7 items-center rounded-md bg-muted p-0.5', className)}
      {...props}
    />
  )
}

export function SegmentedItem({ className, ...props }: ComponentProps<typeof ToggleGroup.Item>) {
  return (
    <ToggleGroup.Item
      className={cn(
        'inline-flex h-6 cursor-default items-center gap-1 rounded-[5px] px-2 text-xs font-medium text-muted-foreground transition-colors outline-none select-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm [&_svg]:size-3.5',
        className,
      )}
      {...props}
    />
  )
}

/** Icon toggle used inside inputs (regex, invert…). */
export function Toggle({ className, ...props }: ComponentProps<typeof TogglePrimitive.Root>) {
  return (
    <TogglePrimitive.Root
      className={cn(
        'inline-flex size-6 cursor-default items-center justify-center rounded-[5px] font-mono text-xs text-subtle-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 data-[state=on]:bg-primary/12 data-[state=on]:text-primary [&_svg]:size-3.5',
        className,
      )}
      {...props}
    />
  )
}
