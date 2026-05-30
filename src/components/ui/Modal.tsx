import type { ReactNode } from "react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** id of the element labelling the dialog (for aria-labelledby). */
  labelledBy?: string;
  ariaLabel?: string;
  /** Click on the backdrop closes the dialog (default true). */
  closeOnBackdrop?: boolean;
  /** Where to send focus on open. "none" = caller manages focus (e.g. a combobox input). */
  initialFocus?: "first" | "container" | "none";
  panelClassName?: string;
  overlayClassName?: string;
}

/**
 * Accessible modal shell: backdrop + role="dialog"/aria-modal, Escape-to-close,
 * focus trap (Tab cycles inside), initial focus, and focus restoration on close.
 * Use for confirmation/celebration/onboarding dialogs so they share one a11y contract.
 */
export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  ariaLabel,
  closeOnBackdrop = true,
  initialFocus = "first",
  panelClassName,
  overlayClassName,
}: ModalProps) {
  useEscapeKey(onClose, open);
  const trapRef = useFocusTrap<HTMLDivElement>(open, initialFocus);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm",
        overlayClassName,
      )}
      onClick={
        closeOnBackdrop
          ? (e) => {
              if (e.target === e.currentTarget) onClose();
            }
          : undefined
      }
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        tabIndex={-1}
        className={cn(
          "modal-in w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-overlay)] outline-none",
          panelClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
