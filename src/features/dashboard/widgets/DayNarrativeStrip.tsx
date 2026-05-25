import { useCallback, useEffect, useState } from "react";
import { DATA_UPDATED_EVENT } from "@/lib/dataSync";
import { getTodayStudySummary } from "@/lib/studyActivity";

export function DayNarrativeStrip() {
  const [headline, setHeadline] = useState(() => getTodayStudySummary().headline);

  const refresh = useCallback(() => setHeadline(getTodayStudySummary().headline), []);

  useEffect(() => {
    refresh();
    window.addEventListener(DATA_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, refresh);
  }, [refresh]);

  return (
    <p className="text-sm text-[var(--text-muted)]" aria-live="polite">
      {headline}
    </p>
  );
}
