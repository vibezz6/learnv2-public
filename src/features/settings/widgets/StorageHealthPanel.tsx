import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { collectStorageHealth, type StorageHealthRow } from "@/lib/storageHealth";
import { DATA_UPDATED_EVENT } from "@/lib/dataSync";

export function StorageHealthPanel() {
  const [rows, setRows] = useState<StorageHealthRow[]>(() => collectStorageHealth());

  const refresh = useCallback(() => setRows(collectStorageHealth()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(DATA_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, refresh);
  }, [refresh]);

  return (
    <Card className="min-w-0">
      <details>
        <summary className="cursor-pointer text-sm font-semibold text-[var(--text-heading)]">
          Storage health (local)
        </summary>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Approximate sizes and row counts for major Learn v2 keys on this device.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                <th className="py-1.5 pr-2 font-medium">Store</th>
                <th className="py-1.5 pr-2 font-medium">Size</th>
                <th className="py-1.5 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--border)]/60">
                  <td className="py-1.5 pr-2 font-medium text-[var(--text)]">{row.label}</td>
                  <td className="py-1.5 pr-2 tabular-nums whitespace-nowrap">
                    {row.bytes > 1024 ? `${(row.bytes / 1024).toFixed(1)} KB` : `${row.bytes} B`}
                  </td>
                  <td className="py-1.5 text-[var(--text-muted)]">
                    <span className="block">{row.detail}</span>
                    <code className="text-[10px] opacity-80">{row.key}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Card>
  );
}
