import { useCallback, useEffect, useState } from "react";

const DEFAULT_MS = 2000;

/** Short-lived banner message (no global toast system). */
export function useTransientMessage(durationMs = DEFAULT_MS) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), durationMs);
    return () => window.clearTimeout(id);
  }, [message, durationMs]);

  const showMessage = useCallback((text: string) => setMessage(text), []);

  return { message, showMessage, clearMessage: () => setMessage(null) };
}
