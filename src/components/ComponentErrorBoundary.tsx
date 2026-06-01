import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { exportManagedStorage } from "@/lib/backupFormat";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Label for the boundary, shown in the fallback (e.g. "page"). */
  scope?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function downloadBackup(): void {
  try {
    const json = exportManagedStorage(localStorage);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learnv2-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    /* best effort */
  }
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
        <Card className="mx-auto my-10 max-w-lg text-center">
          <AlertTriangle className="mx-auto mb-3 text-[var(--warning)]" size={32} aria-hidden />
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">
            Something went wrong{this.props.scope ? ` in this ${this.props.scope}` : ""}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Your progress is still saved on this device. Export a backup to be safe, then try again.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button onClick={() => this.setState({ hasError: false, error: null })}>
              Try again
            </Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reload app
            </Button>
            <Button variant="secondary" onClick={downloadBackup}>
              Export backup
            </Button>
          </div>
        </Card>
      );
    }
    return this.props.children;
  }
}
