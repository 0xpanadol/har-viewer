import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/cn'

interface CopyButtonProps {
  value: string | (() => string)
  label?: string
  className?: string
  size?: 'icon-xs' | 'icon-sm'
}

/** Icon button that confirms inline (check mark) instead of toasting — for high-frequency copies. */
export function CopyButton({ value, label = 'Copy', className, size = 'icon-xs' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1400)
    return () => clearTimeout(timer)
  }, [copied])

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(typeof value === 'function' ? value() : value)
      setCopied(true)
    } catch {
      /* clipboard denied — nothing useful to show inline */
    }
  }

  return (
    <Tooltip content={copied ? 'Copied' : label}>
      <Button
        variant="ghost"
        size={size}
        className={cn(copied && 'text-success hover:text-success', className)}
        onClick={onCopy}
        aria-label={label}
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </Tooltip>
  )
}
