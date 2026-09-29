import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'
import { KbdCombo } from '@/components/ui/kbd'
import type { Entry } from '@/har/types'
import { isModKey, MOD } from '@/lib/platform'
import { useAppStore } from '@/store'
import { selectEntryMap } from '@/store/selectors'

function NoteForm({ entry, onDone }: { entry: Entry; onDone: () => void }) {
  const existing = useAppStore((s) => s.notes[entry.id]?.text ?? '')
  const setNote = useAppStore((s) => s.setNote)
  const removeNote = useAppStore((s) => s.removeNote)
  const [text, setText] = useState(existing)

  const save = () => {
    if (text.trim()) setNote(entry.id, text.trim())
    else removeNote(entry.id)
    onDone()
  }

  return (
    <form
      className="contents"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <DialogHeader>
        <DialogTitle>{existing ? 'Edit note' : 'Add note'}</DialogTitle>
        <DialogDescription className="truncate font-mono">
          #{entry.id + 1} {entry.method} {entry.url}
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <Textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isModKey(e)) {
              e.preventDefault()
              save()
            }
          }}
          placeholder="What’s interesting about this request?"
          rows={5}
        />
        <p className="mt-2 text-xs text-subtle-foreground">
          Notes are stored in this browser and shown on the request row.
        </p>
      </DialogBody>
      <DialogFooter>
        {existing && (
          <Button
            variant="danger"
            size="sm"
            className="mr-auto"
            onClick={() => {
              removeNote(entry.id)
              onDone()
            }}
          >
            Delete note
          </Button>
        )}
        <Button size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm">
          Save{' '}
          <KbdCombo
            keys={[MOD, '↵']}
            className="[&_kbd]:border-primary-foreground/25 [&_kbd]:bg-primary-foreground/15 [&_kbd]:text-primary-foreground"
          />
        </Button>
      </DialogFooter>
    </form>
  )
}

export function NoteDialog() {
  const dialog = useAppStore((s) => s.dialog)
  const closeDialog = useAppStore((s) => s.closeDialog)
  const entry = useAppStore((s) =>
    s.dialog.type === 'note' ? selectEntryMap(s).get(s.dialog.entryId) : undefined,
  )

  return (
    <Dialog open={dialog.type === 'note' && !!entry} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent>{entry && <NoteForm entry={entry} onDone={closeDialog} />}</DialogContent>
    </Dialog>
  )
}
