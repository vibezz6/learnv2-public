import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const KEY_PREVIEW_LIMIT = 10;

interface ImportOverwriteConfirmProps {
  open: boolean;
  title: string;
  keys: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

/** Import gate: lists keys that will be overwritten and requires an explicit ack. */
export function ImportOverwriteConfirm({
  open,
  title,
  keys,
  onConfirm,
  onCancel,
}: ImportOverwriteConfirmProps) {
  const [ack, setAck] = useState(false);

  useEffect(() => {
    if (open) setAck(false);
  }, [open]);

  const preview = keys.slice(0, KEY_PREVIEW_LIMIT);
  const extra = keys.length - preview.length;

  return (
    <Modal open={open} onClose={onCancel} labelledBy="import-overwrite-title">
      <h2 id="import-overwrite-title" className="text-lg font-semibold text-[var(--text-heading)]">
        {title}
      </h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        This replaces data on this device for the keys below. Export first if you need a backup.
      </p>
      <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-panel)] px-3 py-2 font-mono text-[11px] text-[var(--text-muted)]">
        {preview.map((key) => (
          <li key={key} className="break-all">
            {key}
          </li>
        ))}
        {extra > 0 ? <li className="text-[var(--text-subtle)]">and {extra} more</li> : null}
      </ul>
      <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-[var(--text)]">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
          className="mt-0.5"
        />
        <span>I understand this will overwrite local data for these keys.</span>
      </label>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" disabled={!ack} onClick={onConfirm}>
          Import
        </Button>
      </div>
    </Modal>
  );
}
