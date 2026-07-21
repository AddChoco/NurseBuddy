import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Nurse Buddy rendering error', error, info);
    }
  }

  private reload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-cream-50 px-4 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-4xl border-2 border-pink-100 bg-white p-6 text-center shadow-soft dark:border-pink-900/40 dark:bg-gray-800 sm:p-8">
          <h1 className="font-display text-xl font-bold text-gray-800 dark:text-gray-100">
            Nurse Buddy needs to restart
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            An unexpected display error occurred. Your official medical record was not changed.
          </p>
          <button
            type="button"
            onClick={this.reload}
            className="mt-5 rounded-2xl bg-pink-600 px-5 py-3 text-sm font-bold text-white hover:bg-pink-700 focus:outline-none focus:ring-4 focus:ring-pink-400/30"
          >
            Reload Nurse Buddy
          </button>
        </div>
      </main>
    );
  }
}
