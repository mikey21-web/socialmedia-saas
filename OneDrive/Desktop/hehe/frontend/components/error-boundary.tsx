"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "./ui/error-state";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
  }

  retry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      return (
        <div className="p-6">
          <ErrorState
            title="Something went wrong"
            message={this.state.error.message}
            onRetry={this.retry}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
