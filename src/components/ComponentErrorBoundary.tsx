import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Card } from "@/components/ui";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ComponentErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ComponentErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <Card className="mx-auto max-w-lg text-center">
          <AlertTriangle className="mx-auto mb-3 text-[var(--warning)]" size={32} />
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">Something went wrong</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <Button className="mt-4" onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </Button>
        </Card>
      );
    }
    return this.props.children;
  }
}
