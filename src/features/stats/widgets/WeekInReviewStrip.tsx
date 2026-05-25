import { useCallback, useEffect, useState } from "react";
import { DATA_UPDATED_EVENT } from "@/lib/dataSync";
import { buildWeekInReviewParagraph } from "@/lib/studyActivity";

export function WeekInReviewStrip({
  dailyMinutes,
}: {
  dailyMinutes: Record<string, number>;
}) {
  const [paragraph, setParagraph] = useState(() =>
    buildWeekInReviewParagraph(dailyMinutes),
  );

  const refresh = useCallback(
    () => setParagraph(buildWeekInReviewParagraph(dailyMinutes)),
    [dailyMinutes],
  );

  useEffect(() => {
    refresh();
    window.addEventListener(DATA_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, refresh);
  }, [refresh]);

  return (
    <p className="text-sm leading-relaxed text-[var(--text-muted)]" aria-live="polite">
      {paragraph}
    </p>
  );
}
