import { loadCollegeChecklist } from "@/lib/collegeChecklist";
import { loadEssayTracker } from "@/lib/essayTracker";
import { loadStudyActivities, STUDY_ACTIVITY_STORAGE_KEY } from "@/lib/studyActivity";
import { V2_STORAGE_KEY } from "@/stores/progress";

export interface StorageHealthRow {
  id: string;
  label: string;
  key: string;
  bytes: number;
  detail: string;
}

function byteLength(value: string | null): number {
  if (!value) return 0;
  return new Blob([value]).size;
}

export function collectStorageHealth(storage: Storage = localStorage): StorageHealthRow[] {
  const rows: StorageHealthRow[] = [];

  const progressRaw = storage.getItem(V2_STORAGE_KEY);
  let progressDetail = "empty";
  if (progressRaw) {
    try {
      const parsed = JSON.parse(progressRaw) as { state?: { data?: { nodes?: Record<string, unknown> } } };
      const nodeCount = Object.keys(parsed.state?.data?.nodes ?? {}).length;
      progressDetail = `${nodeCount} node record${nodeCount === 1 ? "" : "s"}`;
    } catch {
      progressDetail = "parse error";
    }
  }
  rows.push({
    id: "progress",
    label: "Progress",
    key: V2_STORAGE_KEY,
    bytes: byteLength(progressRaw),
    detail: progressDetail,
  });

  const notesRaw = storage.getItem("learnapp_note_sessions_v2");
  let notesDetail = "empty";
  if (notesRaw) {
    try {
      const count = Object.keys(JSON.parse(notesRaw) as Record<string, unknown>).length;
      notesDetail = `${count} session${count === 1 ? "" : "s"}`;
    } catch {
      notesDetail = "parse error";
    }
  }
  rows.push({
    id: "notes",
    label: "Office hours",
    key: "learnapp_note_sessions_v2",
    bytes: byteLength(notesRaw),
    detail: notesDetail,
  });

  const activityCount = loadStudyActivities(storage).length;
  rows.push({
    id: "activity",
    label: "Study activity",
    key: STUDY_ACTIVITY_STORAGE_KEY,
    bytes: byteLength(storage.getItem(STUDY_ACTIVITY_STORAGE_KEY)),
    detail: `${activityCount} event${activityCount === 1 ? "" : "s"}`,
  });

  const checklist = loadCollegeChecklist(storage);
  const essays = loadEssayTracker(storage);
  rows.push({
    id: "checklist",
    label: "College checklist",
    key: "learnv2_college_checklist_v1",
    bytes: byteLength(storage.getItem("learnv2_college_checklist_v1")),
    detail: `${checklist.customItems.length} custom item${checklist.customItems.length === 1 ? "" : "s"}`,
  });
  rows.push({
    id: "essays",
    label: "Essays",
    key: "learnv2_essay_tracker_v1",
    bytes: byteLength(storage.getItem("learnv2_essay_tracker_v1")),
    detail: `${essays.essays.length} essay${essays.essays.length === 1 ? "" : "s"}`,
  });

  return rows;
}
