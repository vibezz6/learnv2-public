import { useCallback, useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui";
import { collectStorageHealth, type StorageHealthRow } from "@/lib/storageHealth";
import {
  clearStorageErrors,
  loadStorageErrors,
  type StorageErrorEntry,
} from "@/lib/storageErrors";
import {
  getStorageStatus,
  probeStorageWritable,
  subscribeStorageStatus,
  type StorageStatus,
} from "@/lib/storageSafety";
import { DATA_UPDATED_EVENT } from "@/lib/dataSync";

export function StorageHealthPanel() {
  const [rows, setRows] = useState<StorageHealthRow[]>(() => collectStorageHealth());
  const [errors, setErrors] = useState<StorageErrorEntry[]>(() => loadStorageErrors());
  const [status, setStatus] = useState<StorageStatus>(() => getStorageStatus());

  const refresh = useCallback(() => {
    setRows(collectStorageHealth());
    setErrors(loadStorageErrors());
  }, []);

  useEffect(() => {
    refresh();
    // A write probe catches quota/private-mode problems on open.
    probeStorageWritable();
    setStatus(getStorageStatus());
    const onStatus = () => setStatus(getStorageStatus());
    window.addEventListener(DATA_UPDATED_EVENT, refresh);
    const unsub = subscribeStorageStatus(onStatus);
    return () => {
      window.removeEventListener(DATA_UPDATED_EVENT, refresh);
      unsub();
    };
  }, [refresh]);

  return (
    <Card variant="default" density="normal" className="min-w-0">
      {!status.ok ? (
        <div className="mb-3 flex items-start gap-2 rounded-[var(--radius)] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--text)]">
          <TriangleAlert size={15} className="mt-0.5 shrink-0 text-[var(--danger)]" aria-hidden />
          <span>
            This browser is having trouble saving data
            {status.kind === "write" ? " (storage may be full or blocked)" : ""}. Export a backup
            now (above) so you don't lose progress, then free up space or allow site storage.
          </span>
        </div>
      ) : null}
      <details>
        <summary className="flex min-h-9 cursor-pointer items-center gap-2 list-none">
          <span className="eyebrow-mono">Storage health (local)</span>
        </summary>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Approximate sizes and row counts for major Learn v2 keys on this device.
        </p>
        <div className="mt-3 overflow-x-auto rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-canvas)]">
          <table className="w-full min-w-[320px] text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--rule)] font-mono uppercase tracking-wide text-[var(--text-subtle)]">
                <th className="px-3 py-2 font-medium">Store</th>
                <th className="px-3 py-2 font-medium">Size</th>
                <th className="px-3 py-2 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--rule)]/70 last:border-b-0">
                  <td className="px-3 py-2 font-medium text-[var(--text)]">{row.label}</td>
                  <td className="px-3 py-2 font-mono tabular-nums whitespace-nowrap text-[var(--text-muted)]">
                    {row.bytes > 1024 ? `${(row.bytes / 1024).toFixed(1)} KB` : `${row.bytes} B`}
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">
                    <span className="block">{row.detail}</span>
                    <code className="font-mono text-[10px] text-[var(--text-subtle)]">{row.key}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {errors.length > 0 ? (
        <div className="mt-4 space-y-2 border-t border-[var(--rule)] pt-4">
          <p className="eyebrow-mono text-[var(--warning-fg)]">Recent read errors</p>
          <p className="text-xs text-[var(--text-muted)]">
            These keys failed to parse. Export a backup, then fix or clear the key in devtools if
            needed.
          </p>
          <ul className="max-h-32 space-y-2 overflow-y-auto text-xs">
            {errors.map((entry) => (
              <li
                key={`${entry.key}-${entry.timestamp}`}
                className="rounded-[var(--radius)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-3 py-2"
              >
                <code className="font-mono text-[11px] text-[var(--text-heading)]">{entry.key}</code>
                <p className="mt-0.5 text-[var(--text-muted)]">{entry.error}</p>
                <p className="font-mono text-[10px] text-[var(--text-subtle)]">{entry.timestamp}</p>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="text-xs font-medium text-[var(--accent)] hover:underline"
            onClick={() => {
              clearStorageErrors();
              setErrors([]);
            }}
          >
            Clear error log
          </button>
        </div>
      ) : null}
    </Card>
  );
}
