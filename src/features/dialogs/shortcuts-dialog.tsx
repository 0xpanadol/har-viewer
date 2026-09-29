import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import { useAppStore } from '@/store'
import { SHORTCUT_GROUPS } from '../shortcuts/shortcut-map'

export function ShortcutsDialog() {
  const open = useAppStore((s) => s.dialog.type === 'shortcuts')
  const closeDialog = useAppStore((s) => s.closeDialog)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Single-key shortcuts pause while you type in a field.</DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="mb-2 text-2xs font-medium tracking-wide text-subtle-foreground uppercase">
                {group.title}
              </h3>
              <ul className="flex flex-col">
                {group.items.map((item) => (
                  <li
                    key={item.label}
                    className="flex h-8 items-center justify-between gap-3 border-b border-border/60 text-xs last:border-0"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="flex items-center gap-0.5">
                      {item.keys.map((key, i) =>
                        key === '/' || key === '–' ? (
                          <span key={i} className="px-0.5 text-subtle-foreground">
                            {key}
                          </span>
                        ) : (
                          <Kbd key={i}>{key}</Kbd>
                        ),
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
