import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useFileDrop } from '@/hooks/use-file-drop'
import { useThemeEffect } from '@/hooks/use-theme'
import { useUrlHashSync } from '@/hooks/use-url-sync'
import { openFiles, restoreSession } from '@/services/capture'
import { applyCriteriaFromHash } from '@/services/url-state'
import { useAppStore } from '@/store'
import { useHasCapture } from '@/store/selectors'
import { AppShell } from '@/features/shell/app-shell'
import { useGlobalShortcuts } from '@/features/shortcuts/use-global-shortcuts'
import { DropOverlay, LoadingScreen } from '@/features/welcome/status-screens'
import { WelcomeScreen } from '@/features/welcome/welcome-screen'

const onDropFiles = (files: File[]) => void openFiles(files)

function useDocumentTitle() {
  const fileName = useAppStore((s) => s.fileName)
  useEffect(() => {
    document.title = fileName ? `${fileName} · HAR Viewer` : 'HAR Viewer'
  }, [fileName])
}

export function App() {
  const hasCapture = useHasCapture()
  const loading = useAppStore((s) => s.loading)
  const [restoring, setRestoring] = useState(true)
  const dragging = useFileDrop(onDropFiles)

  useThemeEffect()
  useDocumentTitle()
  useGlobalShortcuts()
  useUrlHashSync(hasCapture && !restoring)

  useEffect(() => {
    applyCriteriaFromHash()
    void restoreSession().finally(() => setRestoring(false))
  }, [])

  return (
    <TooltipProvider delayDuration={450} skipDelayDuration={150}>
      {restoring ? (
        <LoadingScreen label="Restoring your last session" progress={null} />
      ) : loading ? (
        <LoadingScreen {...loading} />
      ) : hasCapture ? (
        <AppShell />
      ) : (
        <WelcomeScreen />
      )}
      <DropOverlay visible={dragging} replacing={hasCapture} />
      <Toaster />
    </TooltipProvider>
  )
}
