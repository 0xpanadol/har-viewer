import { X } from 'lucide-react'
import { Dialog as Primitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './button'

export const Dialog = Primitive.Root
export const DialogTrigger = Primitive.Trigger
export const DialogClose = Primitive.Close

const overlay =
  'fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0'

type ContentProps = ComponentProps<typeof Primitive.Content> & { hideClose?: boolean }

export function DialogContent({ className, children, hideClose, ...props }: ContentProps) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className={overlay} />
      <Primitive.Content
        className={cn(
          'text-popover-foreground fixed top-[12vh] left-1/2 z-50 flex max-h-[80vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 flex-col overflow-hidden rounded-xl bg-popover shadow-overlay outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]',
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <Primitive.Close asChild>
            <Button variant="ghost" size="icon-sm" className="absolute top-3 right-3" aria-label="Close">
              <X />
            </Button>
          </Primitive.Close>
        )}
      </Primitive.Content>
    </Primitive.Portal>
  )
}

export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1 border-b px-5 pt-4 pr-12 pb-3.5', className)} {...props} />
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof Primitive.Title>) {
  return <Primitive.Title className={cn('text-sm font-semibold', className)} {...props} />
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof Primitive.Description>) {
  return <Primitive.Description className={cn('text-xs text-muted-foreground', className)} {...props} />
}

export function DialogBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4', className)} {...props} />
}

export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-center justify-end gap-2 border-t bg-panel px-5 py-3', className)}
      {...props}
    />
  )
}

/** Side sheet built on Dialog — used for the filter sidebar and inspector on narrow screens. */
export function SheetContent({
  side = 'right',
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Content> & { side?: 'left' | 'right' }) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className={overlay} />
      <Primitive.Content
        className={cn(
          'fixed inset-y-0 z-50 flex w-full max-w-[min(100vw,520px)] flex-col bg-panel shadow-overlay outline-none data-[state=closed]:animate-out data-[state=closed]:duration-150 data-[state=open]:animate-in data-[state=open]:duration-200',
          side === 'right'
            ? 'right-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right'
            : 'left-0 max-w-72 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
          className,
        )}
        {...props}
      >
        {children}
      </Primitive.Content>
    </Primitive.Portal>
  )
}
