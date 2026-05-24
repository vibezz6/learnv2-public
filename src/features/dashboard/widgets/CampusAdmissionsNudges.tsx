import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ClipboardList } from "lucide-react";
import { getCampusAdmissionsNudges } from "@/lib/campusAdmissionsNudges";
import { loadCollegeChecklist } from "@/lib/collegeChecklist";
import { loadEssayTracker } from "@/lib/essayTracker";
import { usePreferences } from "@/stores/preferences";

export function CampusAdmissionsNudges() {
  const location = useLocation();
  const placementGoal = usePreferences((s) => s.placementGoal);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (location.pathname === "/") setTick((t) => t + 1);
  }, [location.pathname]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, []);

  const nudges = useMemo(() => {
    void tick;
    return getCampusAdmissionsNudges(loadCollegeChecklist(), loadEssayTracker(), {
      placementGoal,
      max: 3,
    });
  }, [placementGoal, tick]);

  if (nudges.length === 0) return null;

  return (
    <div className="mt-5 rounded-[var(--radius)] border border-[var(--warning)]/35 bg-[var(--warning-bg)] p-4">
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
              <li key={nudge.id}>
                <Link
                  to={nudge.href}
                  className="group flex items-start justify-between gap-2 rounded-[var(--radius)] py-0.5 text-sm transition hover:text-[var(--accent)]"
                >
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
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/campus"
            className="inline-block text-xs font-medium text-[var(--accent)] hover:underline"
          >
            All campus services
          </Link>
        </div>
      </div>
    </div>
  );
}
