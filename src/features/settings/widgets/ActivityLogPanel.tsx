import { useCallback, useEffect, useState } from "react";
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
    <Card className="min-w-0">
      <details>
        <summary className="cursor-pointer text-sm font-semibold text-[var(--text-heading)]">
          Activity log (local)
        </summary>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Last 20 study events on this device. For debugging and backup — not synced to the cloud.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                <th className="py-1.5 pr-2 font-medium">Time</th>
                <th className="py-1.5 pr-2 font-medium">Type</th>
                <th className="py-1.5 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-3 text-[var(--text-muted)]">
                    No activity recorded yet.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="border-b border-[var(--border)]/60">
                    <td className="py-1.5 pr-2 tabular-nums whitespace-nowrap">
                      {new Date(event.at).toLocaleString()}
                    </td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{event.type}</td>
                    <td className="py-1.5 text-[var(--text)]">
                      {formatActivityLabel(event)}
                      {event.nodeId ? ` · ${event.nodeId}` : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Button type="button" variant="secondary" className="mt-3" onClick={handleExport}>
          Export JSON
        </Button>
      </details>
    </Card>
  );
}
