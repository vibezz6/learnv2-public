import { loadCollegeChecklist } from "@/lib/collegeChecklist";
import { loadEssayTracker } from "@/lib/essayTracker";
import { loadStudyActivities } from "@/lib/studyActivity";
import {
  V2_NOTE_SESSIONS_KEY,
  V2_STORAGE_KEY,
  STORAGE_KEYS,
} from "@/lib/storageRegistry";

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

  const notesRaw = storage.getItem(V2_NOTE_SESSIONS_KEY);
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
    key: V2_NOTE_SESSIONS_KEY,
    bytes: byteLength(notesRaw),
    detail: notesDetail,
  });

  const activityCount = loadStudyActivities(storage).length;
  rows.push({
    id: "activity",
    label: "Study activity",
    key: "learnv2_activity_v1",
    bytes: byteLength(storage.getItem("learnv2_activity_v1")),
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

  for (const entry of STORAGE_KEYS) {
    if (!entry.backup || entry.dynamicPrefix || rows.some((row) => row.key === entry.key)) continue;
    const raw = storage.getItem(entry.key);
    if (!raw) continue;
    rows.push({
      id: entry.key,
      label: entry.label,
      key: entry.key,
      bytes: byteLength(raw),
      detail: entry.note ?? entry.domain,
    });
  }

  return rows;
}
