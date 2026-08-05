import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React UI error:', error, errorInfo);
  }

  public handleReset = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-industrial-950 flex items-center justify-center p-6 text-slate-100">
          <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl border border-red-500/20">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-slate-100">UI Application Exception</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected interface error occurred. This can happen if local session cache is corrupted.
            </p>
            {this.state.error && (
              <div className="p-3 bg-slate-900/80 rounded-lg text-[11px] font-mono text-red-400 text-left overflow-x-auto border border-slate-800">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Cache & Return to Login</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
