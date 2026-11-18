import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught render exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearLocalAndReload = () => {
    try {
      localStorage.removeItem('ncep_trainee_info');
      localStorage.removeItem('ncep_detailed_logs');
      localStorage.removeItem('ncep_final_signoff');
    } catch (e) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const rawMsg = this.state.error?.message || '';
      const isQuotaError = rawMsg.includes('Quota exceeded');

      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Application Recovered</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isQuotaError
                  ? 'Daily Firestore free-tier usage quota has been reached and resets tomorrow. Your local clinical logbook remains safely saved.'
                  : 'An unexpected display error occurred while synchronizing records. Your clinical logbook data remains safely saved.'}
              </p>
              {rawMsg && (
                <p className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2 mt-2 break-words max-h-32 overflow-y-auto">
                  {rawMsg}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resume Logbook</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                onClick={this.handleClearLocalAndReload}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                <span>Refresh Cached View</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
