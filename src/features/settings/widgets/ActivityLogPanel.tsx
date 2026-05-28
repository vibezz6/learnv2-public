import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  ACTIVITY_UPDATED_EVENT,
  exportStudyActivitiesJson,
  formatActivityLabel,
  listActivities,
  type StudyActivityEvent,
} from "@/lib/studyActivity";

export function ActivityLogPanel() {
  const [events, setEvents] = useState<StudyActivityEvent[]>(() => listActivities(20));

  const refresh = useCallback(() => setEvents(listActivities(20)), []);

  useEffect(() => {
    refresh();
    window.addEventListener(ACTIVITY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(ACTIVITY_UPDATED_EVENT, refresh);
  }, [refresh]);

  const handleExport = () => {
    const blob = new Blob([exportStudyActivitiesJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learnv2-activity-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card variant="default" density="normal" className="min-w-0">
      <details>
        <summary className="flex min-h-9 cursor-pointer items-center gap-2 list-none">
          <span className="eyebrow-mono">Activity log (local)</span>
        </summary>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Last 20 study events on this device. For debugging and backup — not synced to the cloud.
        </p>
        <div className="mt-3 overflow-x-auto rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-canvas)]">
          <table className="w-full min-w-[320px] text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--rule)] font-mono uppercase tracking-wide text-[var(--text-subtle)]">
                <th className="px-3 py-2 font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-3 text-[var(--text-muted)]">
                    No activity recorded yet.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="border-b border-[var(--rule)]/70 last:border-b-0">
                    <td className="px-3 py-2 font-mono text-[11px] tabular-nums whitespace-nowrap text-[var(--text-muted)]">
                      {new Date(event.at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap text-[var(--text-muted)]">
                      {event.type}
                    </td>
                    <td className="px-3 py-2 text-[var(--text)]">
                      {formatActivityLabel(event)}
                      {event.nodeId ? (
                        <span className="ml-1 font-mono text-[11px] text-[var(--text-subtle)]">
                          · {event.nodeId}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={handleExport}>
          <Download size={13} aria-hidden />
          Export JSON
        </Button>
      </details>
    </Card>
  );
}
