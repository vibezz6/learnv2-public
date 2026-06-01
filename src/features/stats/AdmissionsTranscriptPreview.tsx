import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import type { AdmissionsSummary } from "@/lib/admissionsSummary";

interface Props {
  admissions: AdmissionsSummary;
}

export function AdmissionsTranscriptPreview({ admissions }: Props) {
  if (!admissions.hasActivity) {
    return (
      <div className="mt-4 border-t border-[var(--border)] pt-4">
        <p className="text-xs leading-relaxed text-[var(--text-muted)]">
          <Link to="/campus" className="font-medium text-[var(--accent)] hover:underline">
            College services
          </Link>{" "}
          — add your college checklist or essay tracker to include admissions progress in the copied
          transcript.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
      <div className="flex items-center gap-2">
        <ClipboardList size={14} className="shrink-0 text-[var(--accent-2)]" aria-hidden />
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
          College applications (included when you copy)
        </p>
      </div>
      <ul className="space-y-1.5 text-sm text-[var(--text-muted)]">
        <li>
          <span className="text-[var(--text-heading)]">Checklist:</span>{" "}
          {admissions.checklistDone}/{admissions.checklistTotal} complete ({admissions.checklistPct}
          %)
        </li>
        <li>
          <span className="text-[var(--text-heading)]">Essays:</span> {admissions.essaysTracked}{" "}
          tracked · {admissions.essaysFinal} final
        </li>
      </ul>
      {admissions.essayLines.length > 0 && (
        <ul className="space-y-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
          {admissions.essayLines.slice(0, 5).map((essay) => (
            <li key={`${essay.title}-${essay.statusLabel}`} className="text-xs leading-relaxed">
              <span className="font-medium text-[var(--text-heading)]">{essay.title}</span>
              {essay.college && (
                <span className="text-[var(--text-muted)]"> · {essay.college}</span>
              )}
              <span className="block text-[var(--text-muted)]">
                {essay.statusLabel}
                {essay.dueDate ? ` · due ${essay.dueDate}` : ""}
              </span>
            </li>
          ))}
          {admissions.essayLines.length > 5 && (
            <li className="text-[11px] text-[var(--text-muted)]">
              +{admissions.essayLines.length - 5} more in essay tracker
            </li>
          )}
        </ul>
      )}
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <Link
          to="/campus/college-checklist"
          className="font-medium text-[var(--accent)] hover:underline"
        >
          Edit checklist
        </Link>
        <Link
          to="/campus/essay-tracker"
          className="font-medium text-[var(--accent)] hover:underline"
        >
          Essay tracker
        </Link>
      </p>
    </div>
  );
}
