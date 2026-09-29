import { ChevronRight } from 'lucide-react'
import { ContextMenu as Primitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { menuContent, menuItem, menuLabel, menuSeparator, menuShortcut } from './menu-styles'

export const ContextMenu = Primitive.Root
export const ContextMenuTrigger = Primitive.Trigger
export const ContextMenuSub = Primitive.Sub

export function ContextMenuContent({ className, ...props }: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        collisionPadding={8}
        className={cn(menuContent, 'max-h-(--radix-context-menu-content-available-height)', className)}
        {...props}
      />
    </Primitive.Portal>
  )
}

type ItemProps = ComponentProps<typeof Primitive.Item> & { variant?: 'default' | 'danger' }

export function ContextMenuItem({ className, variant = 'default', ...props }: ItemProps) {
  return <Primitive.Item data-variant={variant} className={cn(menuItem, className)} {...props} />
}

export function ContextMenuLabel({ className, ...props }: ComponentProps<typeof Primitive.Label>) {
  return <Primitive.Label className={cn(menuLabel, className)} {...props} />
}

export function ContextMenuSeparator({ className, ...props }: ComponentProps<typeof Primitive.Separator>) {
  return <Primitive.Separator className={cn(menuSeparator, className)} {...props} />
}

export function ContextMenuShortcut({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn(menuShortcut, className)} {...props} />
}

export function ContextMenuSubTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.SubTrigger>) {
  return (
    <Primitive.SubTrigger className={cn(menuItem, 'data-[state=open]:bg-muted', className)} {...props}>
      {children}
      <ChevronRight className="ml-auto size-3.5!" />
    </Primitive.SubTrigger>
  )
}

export function ContextMenuSubContent({ className, ...props }: ComponentProps<typeof Primitive.SubContent>) {
  return (
    <Primitive.Portal>
      <Primitive.SubContent collisionPadding={8} className={cn(menuContent, className)} {...props} />
    </Primitive.Portal>
  )
}
