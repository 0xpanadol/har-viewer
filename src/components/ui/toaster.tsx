import { Toaster as Sonner } from 'sonner'
import { useResolvedTheme } from '@/hooks/use-theme'

export function Toaster() {
  const theme = useResolvedTheme()
  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      offset={40}
      duration={3200}
      toastOptions={{
        classNames: {
          toast:
            'rounded-lg! border-border! bg-popover! text-popover-foreground! shadow-overlay! text-[13px]! gap-2.5!',
          description: 'text-muted-foreground! text-xs!',
          actionButton: 'bg-primary! text-primary-foreground! rounded-md! font-medium!',
        },
      }}
    />
  )
}
