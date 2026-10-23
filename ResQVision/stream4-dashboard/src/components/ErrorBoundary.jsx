import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    if (import.meta.env.DEV) {
      console.error('[ResQVision ErrorBoundary]', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-6 text-[#F1F5F9]">
          <div className="max-w-lg w-full bg-[#131F31] border border-[#EF4444]/40 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="inline-flex p-3 rounded-2xl bg-[#EF4444]/10 text-[#EF4444] mb-4 border border-[#EF4444]/30">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white mb-2">
              Command Interface Rendering Exception
            </h1>
            <p className="text-xs text-[#94A3B8] mb-6 leading-relaxed">
              The dashboard encountered an unexpected view state exception. Safe recovery controls are available below.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="bg-[#0B1220] border border-[#263449] p-3 rounded-xl text-left text-xs font-mono text-red-300 mb-6 overflow-auto max-h-36">
                <p className="font-bold text-red-400 mb-1">{this.state.error.toString()}</p>
                <pre className="text-[11px] text-slate-400 whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
              </div>
            )}

            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#67D4F3] hover:bg-[#38BDF8] text-[#0B1220] font-mono font-semibold text-xs transition shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Command Interface</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
