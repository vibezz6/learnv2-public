import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { applyServiceWorkerUpdate, onServiceWorkerUpdate } from "@/lib/serviceWorker";

export function ServiceWorkerUpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return onServiceWorkerUpdate(() => setVisible(true));
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 left-3 right-3 z-50 mx-auto flex max-w-lg flex-col gap-2 rounded-[var(--radius-lg)] border border-[var(--accent-border)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-md)] min-[481px]:bottom-6 min-[481px]:left-auto min-[481px]:right-6"
      role="status"
    >
      <p className="text-sm text-[var(--text-heading)]">
        A new version of Learn is ready. Reload to get the latest fixes.
      </p>
      <div className="flex gap-2">
        <Button
          className="min-h-11 flex-1 touch-manipulation"
          onClick={() => applyServiceWorkerUpdate()}
        >
          Reload
        </Button>
        <Button
          variant="secondary"
          className="min-h-11 touch-manipulation"
          onClick={() => setVisible(false)}
        >
          Later
        </Button>
      </div>
    </div>
  );
}
