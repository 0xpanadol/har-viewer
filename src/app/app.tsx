import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useFileDrop } from '@/hooks/use-file-drop'
import { useThemeEffect } from '@/hooks/use-theme'
import { useUrlHashSync } from '@/hooks/use-url-sync'
import { openFiles, restoreSession } from '@/services/capture'
import { connectStream, streamConfig } from '@/services/stream'
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
  const live = useAppStore((s) => s.live)
  const isLiveEnv = streamConfig() !== null
  const [restoring, setRestoring] = useState(!isLiveEnv)
  const dragging = useFileDrop(onDropFiles)

  useThemeEffect()
  useDocumentTitle()
  useGlobalShortcuts()
  useUrlHashSync(hasCapture && !restoring)

  useEffect(() => {
    if (streamConfig()) {
      connectStream()
      return
    }
    applyCriteriaFromHash()
    void restoreSession().finally(() => setRestoring(false))
  }, [])

  const connectingLive = isLiveEnv && !hasCapture && live?.status === 'connecting'

  return (
    <TooltipProvider delayDuration={450} skipDelayDuration={150}>
      {connectingLive ? (
        <LoadingScreen label="Connecting to live stream" progress={null} />
      ) : restoring ? (
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
