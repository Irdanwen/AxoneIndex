"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-axone-dark">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-axone-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-white-pure mb-2">
              Oups ! Quelque chose s&apos;est mal passé
            </h2>
            <p className="text-white-75 mb-4">
              Une erreur inattendue s&apos;est produite. Veuillez rafraîchir la page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-axone-accent text-axone-dark px-4 py-2 rounded-lg font-semibold hover:bg-axone-accent-light transition-colors"
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
