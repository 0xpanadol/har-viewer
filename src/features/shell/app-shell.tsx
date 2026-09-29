import { CommandPalette } from '../command/command-palette'
import { DiffDialog } from '../dialogs/diff-dialog'
import { NoteDialog } from '../dialogs/note-dialog'
import { ReplayDialog } from '../dialogs/replay-dialog'
import { ShortcutsDialog } from '../dialogs/shortcuts-dialog'
import { AppHeader } from './app-header'
import { SelectionBar } from './selection-bar'
import { StatusBar } from './status-bar'
import { ViewTabs } from './view-tabs'
import { Workspace } from './workspace'

export function AppShell() {
  return (
    <div className="flex h-full flex-col">
      <AppHeader />
      <ViewTabs />
      <Workspace />
      <StatusBar />
      <SelectionBar />
      <CommandPalette />
      <ShortcutsDialog />
      <NoteDialog />
      <DiffDialog />
      <ReplayDialog />
    </div>
  )
}
