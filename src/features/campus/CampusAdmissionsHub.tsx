import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, FileText, Settings } from "lucide-react";
import { Card } from "@/components/ui";
import { ADMISSIONS_UPDATED_EVENT } from "@/lib/admissionsSync";
import {
  buildAdmissionsSummary,
  getBlockingApplicationItem,
} from "@/lib/admissionsSummary";

export function CampusAdmissionsHub() {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const bump = () => setRevision((r) => r + 1);
    window.addEventListener(ADMISSIONS_UPDATED_EVENT, bump);
    return () => window.removeEventListener(ADMISSIONS_UPDATED_EVENT, bump);
  }, []);

  const summary = useMemo(() => {
    void revision;
    return buildAdmissionsSummary();
  }, [revision]);

  const blocking = useMemo(() => {
    void revision;
    return getBlockingApplicationItem();
  }, [revision]);

  return (
    <Card className="min-w-0 space-y-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--accent-2)]">
          College applications
        </p>
        {blocking ? (
          <div className="mt-3 rounded-[var(--radius)] border border-[var(--warning)]/35 bg-[var(--warning-bg)] p-4">
            <p className="text-sm font-medium text-[var(--text-heading)]">Blocking this week</p>
            <p className="mt-1 text-sm text-[var(--text-heading)]">{blocking.title}</p>
            {blocking.detail ? (
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{blocking.detail}</p>
            ) : null}
            {blocking.nextStep ? (
              <p className="mt-2 text-sm text-[var(--accent-2)]">Next: {blocking.nextStep}</p>
            ) : null}
            <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">
              {blocking.overdue
                ? "Overdue"
                : blocking.daysUntil === 0
                  ? "Due today"
                  : `Due in ${blocking.daysUntil} day${blocking.daysUntil === 1 ? "" : "s"}`}
            </p>
            <Link
              to={blocking.href}
              className="mt-2 inline-flex min-h-10 items-center text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Open and update
            </Link>
          </div>
        ) : null}
        {summary.hasActivity ? (
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Checklist{" "}
            <span className="font-medium text-[var(--text-heading)]">
              {summary.checklistDone}/{summary.checklistTotal}
            </span>{" "}
            ({summary.checklistPct}%) · Essays{" "}
            <span className="font-medium text-[var(--text-heading)]">
              {summary.essaysTracked} tracked
            </span>
            {summary.essaysFinal > 0 ? ` · ${summary.essaysFinal} final` : null}
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Track FAFSA, essays, and deadlines on this device. Export or import from Settings when you
            switch browsers.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link to="/campus/college-checklist" className="min-w-0 flex-1">
          <span className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-3 text-sm font-medium text-[var(--text-heading)] transition hover:border-[var(--accent)] touch-manipulation">
            <ClipboardList size={16} aria-hidden />
            Checklist
          </span>
        </Link>
        <Link to="/campus/essay-tracker" className="min-w-0 flex-1">
          <span className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-3 text-sm font-medium text-[var(--text-heading)] transition hover:border-[var(--accent)] touch-manipulation">
            <FileText size={16} aria-hidden />
            Essays
          </span>
        </Link>
        <Link to="/settings#admissions-backup" className="min-w-0 flex-1">
          <span className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-3 text-sm font-medium text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--text-heading)] touch-manipulation">
            <Settings size={16} aria-hidden />
            Backup
          </span>
        </Link>
      </div>
    </Card>
  );
}
