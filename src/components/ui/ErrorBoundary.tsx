// CVIA — Error Boundary Component
// SIH26228 · Ministry of Defence / DGIS
// Matches existing CVIA website styling, protects against white screen crashes

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RotateCcw, LayoutDashboard, ShieldAlert } from 'lucide-react';
import { Button, Card, CardHeader, CardBody } from './index';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log actual error to console for engineering diagnosis without exposing secrets in UI
    console.error('[CVIA ErrorBoundary] Uncaught runtime error caught:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  private handleGoDashboard = () => {
    window.location.href = '/console';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
        }}>
          <Card style={{
            maxWidth: 580,
            width: '100%',
            border: '1px solid var(--color-border)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            background: 'var(--color-bg-surface)',
          }}>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 6,
                  background: 'var(--color-critical-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-critical-icon)',
                  border: '1px solid var(--color-critical-border)',
                }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>
                    {this.props.fallbackTitle || 'Verification temporarily unavailable'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    System Integrity Assurance Guard · Offline Fallback Active
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div style={{
                padding: '14px 16px',
                borderRadius: 6,
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <AlertOctagon size={18} style={{ color: 'var(--color-review-icon)', marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    The requested verification view encountered an unexpected state while preparing baseline assets.
                    Baseline integrity models and offline local analysis engines remain intact.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={this.handleGoDashboard}
                  icon={<LayoutDashboard size={15} />}
                >
                  Back to Dashboard
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={this.handleRetry}
                  icon={<RotateCcw size={15} />}
                >
                  Try Again
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
