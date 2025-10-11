import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    this.setState({ error, info })
    // You could also log to an external service here
    // console.error('Captured error in ErrorBoundary', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#c0392b' }}>Something went wrong</h2>
        <p>The app encountered an error during rendering. Check the browser console for details.</p>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 12px', borderRadius: 6 }}>Reload</button>
        </div>
        <details style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
          <summary>Technical details</summary>
          {this.state.error && this.state.error.toString()}
          {this.state.info && '\n' + (this.state.info.componentStack || '')}
        </details>
      </div>
    )
  }
}
