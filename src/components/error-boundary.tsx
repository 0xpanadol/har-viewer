import { TriangleAlert } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui/button'

interface Props {
  label: string
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Contains a crash to one region so the rest of the workspace keeps working. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.label}]`, error, info.componentStack)
  }

  override render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <TriangleAlert className="size-5 text-danger" />
        <div className="max-w-sm">
          <p className="text-[13px] font-medium">{this.props.label} failed to render</p>
          <p className="mt-1 font-mono text-xs break-all text-muted-foreground">{this.state.error.message}</p>
        </div>
        <Button size="sm" onClick={() => this.setState({ error: null })}>
          Try again
        </Button>
      </div>
    )
  }
}
