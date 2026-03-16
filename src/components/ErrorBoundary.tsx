import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary a capturé une erreur:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#e53e3e',
          textAlign: 'center',
          padding: '20px',
          background: '#fef2f2'
        }}>
          <div style={{ maxWidth: '600px' }}>
            <h1 style={{ 
              fontSize: '24px', 
              marginBottom: '16px',
              color: '#dc2626'
            }}>
              ⚠️ Erreur dans l'application
            </h1>
            <p style={{ 
              fontSize: '16px', 
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              Une erreur inattendue s'est produite. L'application a été arrêtée pour éviter des problèmes supplémentaires.
            </p>
            
            {this.state.error && (
              <details style={{
                textAlign: 'left',
                backgroundColor: '#fff',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #fecaca'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  Détails de l'erreur
                </summary>
                <div style={{ marginTop: '12px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Message:</strong> {this.state.error.message}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Nom:</strong> {this.state.error.name}
                  </div>
                  {this.state.errorInfo && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Composant:</strong> {this.state.errorInfo.componentStack}
                    </div>
                  )}
                  <div>
                    <strong>Stack trace:</strong>
                    <pre style={{
                      backgroundColor: '#f5f5f5',
                      padding: '12px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '12px',
                      border: '1px solid #e5e7eb',
                      marginTop: '8px'
                    }}>
                      {this.state.error.stack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
            
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Recharger l'application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
