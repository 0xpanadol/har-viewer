import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  label?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`, error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{ padding: 16, color: 'var(--red)', fontSize: 12, fontFamily: 'var(--mono)' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {this.props.label ? `${this.props.label}: ` : ''}Component Error
          </div>
          <div style={{ color: 'var(--text-2)' }}>{this.state.error?.message}</div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 8, padding: '4px 12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-1)', cursor: 'pointer', fontSize: 11 }}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
