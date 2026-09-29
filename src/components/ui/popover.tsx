import { HoverCard as HoverPrimitive, Popover as Primitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

const surface =
  'z-50 rounded-lg bg-popover text-popover-foreground shadow-overlay outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'

export const Popover = Primitive.Root
export const PopoverTrigger = Primitive.Trigger
export const PopoverAnchor = Primitive.Anchor
export const PopoverClose = Primitive.Close

export function PopoverContent({
  className,
  sideOffset = 6,
  align = 'start',
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(surface, 'w-72 p-3', className)}
        {...props}
      />
    </Primitive.Portal>
  )
}

export const HoverCard = HoverPrimitive.Root
export const HoverCardTrigger = HoverPrimitive.Trigger

export function HoverCardContent({
  className,
  sideOffset = 6,
  align = 'start',
  ...props
}: ComponentProps<typeof HoverPrimitive.Content>) {
  return (
    <HoverPrimitive.Portal>
      <HoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(surface, 'w-96 p-3', className)}
        {...props}
      />
    </HoverPrimitive.Portal>
  )
}
