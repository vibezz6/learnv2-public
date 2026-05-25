import { Link } from "react-router-dom";
import { Button } from "./Button";

interface FocusStudyBarProps {
  backTo: string;
  backLabel: string;
  onExitFocus: () => void;
  accentColor?: string;
}

/** Compact chrome shown in focus mode instead of PageHeader. */
export function FocusStudyBar({ backTo, backLabel, onExitFocus, accentColor }: FocusStudyBarProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b pb-4"
      style={{
        borderColor: accentColor ? `${accentColor}40` : "var(--border)",
      }}
    >
      <Link
        to={backTo}
        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-heading)]"
      >
        ← {backLabel}
      </Link>
      <Button variant="ghost" onClick={onExitFocus}>
        Exit focus
      </Button>
    </div>
  );
}
