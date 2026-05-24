import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ClipboardList, X } from "lucide-react";
import { ADMISSIONS_UPDATED_EVENT } from "@/lib/admissionsSync";
import { getCampusAdmissionsNudges } from "@/lib/campusAdmissionsNudges";
import { loadCollegeChecklist } from "@/lib/collegeChecklist";
import { loadEssayTracker } from "@/lib/essayTracker";
import { DEFAULT_SNOOZE_DAYS, NUDGE_SNOOZE_KEY, snoozeNudge } from "@/lib/nudgeSnooze";
import { usePreferences } from "@/stores/preferences";

export function CampusAdmissionsNudges() {
  const location = useLocation();
  const placementGoal = usePreferences((s) => s.placementGoal);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const bump = () => setRevision((r) => r + 1);
    window.addEventListener(ADMISSIONS_UPDATED_EVENT, bump);
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "learnv2_college_checklist_v1" ||
        e.key === "learnv2_essay_tracker_v1" ||
        e.key === NUDGE_SNOOZE_KEY
      ) {
        bump();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ADMISSIONS_UPDATED_EVENT, bump);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (location.pathname === "/") setRevision((r) => r + 1);
  }, [location.pathname]);

  const nudges = useMemo(() => {
    void revision;
    return getCampusAdmissionsNudges(loadCollegeChecklist(), loadEssayTracker(), {
      placementGoal,
      max: 3,
    });
  }, [placementGoal, revision]);

  const handleSnooze = useCallback((nudgeId: string) => {
    snoozeNudge(nudgeId);
    setRevision((r) => r + 1);
  }, []);

  if (nudges.length === 0) return null;

  return (
    <div
      className="mt-5 rounded-[var(--radius)] border border-[var(--warning)]/35 bg-[var(--warning-bg)] p-4"
      role="region"
      aria-label="Admissions reminders"
    >
      <div className="flex items-start gap-3">
        <ClipboardList
          size={16}
          className="mt-0.5 shrink-0 text-[var(--warning)]"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm font-medium text-[var(--text-heading)]">Admissions reminders</p>
          <ul className="space-y-2">
            {nudges.map((nudge) => (
              <li key={nudge.id} className="flex items-start gap-1">
                <Link
                  to={nudge.href}
                  className="group min-w-0 flex-1 rounded-[var(--radius)] py-1 pr-1 text-sm transition hover:text-[var(--accent)] touch-manipulation"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="font-medium text-[var(--text-heading)] group-hover:text-[var(--accent)]">
                        {nudge.title}
                      </span>
                      {nudge.detail && (
                        <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                          {nudge.detail}
                        </span>
                      )}
                    </span>
                    <ArrowRight
                      size={14}
                      className="mt-1 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--accent)]"
                      aria-hidden
                    />
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => handleSnooze(nudge.id)}
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-heading)] touch-manipulation"
                  aria-label={`Dismiss for ${DEFAULT_SNOOZE_DAYS} days`}
                  title={`Remind me in ${DEFAULT_SNOOZE_DAYS} days`}
                >
                  <X size={16} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-[var(--text-muted)]">
            Dismiss hides a reminder for {DEFAULT_SNOOZE_DAYS} days. Deadlines still show below when
            due.
          </p>
          <Link
            to="/campus"
            className="inline-flex min-h-11 items-center text-xs font-medium text-[var(--accent)] hover:underline"
          >
            All campus services
          </Link>
        </div>
      </div>
    </div>
  );
}
