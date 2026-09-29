import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/app'
import { ErrorBoundary } from '@/components/error-boundary'
import '@/styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary label="HAR Viewer">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
