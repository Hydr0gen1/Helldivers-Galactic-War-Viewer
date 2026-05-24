import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center max-w-md p-8">
            <div className="text-red-500 text-6xl mb-4">⚠</div>
            <h1 className="text-2xl font-bold text-gray-100 mb-2">
              Frontline reporting officer is down.
            </h1>
            <p className="text-gray-400 mb-6">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition-colors"
            >
              Try Refreshing
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
