import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-100 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900">Oups ! Une erreur est survenue.</h1>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-left overflow-auto max-h-32">
                <p className="text-xs text-slate-500 font-mono break-words">
                    {this.state.error?.message || "Erreur inconnue"}
                </p>
            </div>

            <p className="text-slate-600">
              L'application a rencontré un problème inattendu. Veuillez rafraîchir la page.
            </p>

            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Home size={18} /> Accueil
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <RefreshCw size={18} /> Rafraîchir
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;