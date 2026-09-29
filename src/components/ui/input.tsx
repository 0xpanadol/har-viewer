import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const inputBase =
  'h-8 w-full min-w-0 rounded-md border border-input bg-background px-2.5 text-[13px] text-foreground transition-[border-color,box-shadow] outline-none placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-danger/20'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(inputBase, className)} {...props} />
}

/** Input with leading/trailing adornments inside a single focus ring. */
export function InputGroup({
  leading,
  trailing,
  className,
  children,
}: {
  leading?: ReactNode
  trailing?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex h-8 min-w-0 items-center gap-1.5 rounded-md border border-input bg-background px-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20 [&_input]:h-full [&_input]:min-w-0 [&_input]:flex-1 [&_input]:bg-transparent [&_input]:text-[13px] [&_input]:outline-none [&_input]:placeholder:text-subtle-foreground',
        className,
      )}
    >
      {leading && (
        <span className="flex shrink-0 items-center text-subtle-foreground [&_svg]:size-4">{leading}</span>
      )}
      {children}
      {trailing && <span className="flex shrink-0 items-center gap-0.5">{trailing}</span>}
    </div>
  )
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(inputBase, 'h-auto min-h-24 resize-y py-2 leading-relaxed', className)}
      {...props}
    />
  )
}
