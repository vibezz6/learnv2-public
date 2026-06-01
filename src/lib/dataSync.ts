import { ACTIVITY_UPDATED_EVENT } from "@/lib/studyActivity";
import { ADMISSIONS_UPDATED_EVENT } from "@/lib/admissionsSync";

/** Fired when any local study-related store changes (activity, admissions, notes, progress). */
export const DATA_UPDATED_EVENT = "learnv2-data-updated";

let wired = false;

export function notifyDataUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DATA_UPDATED_EVENT));
}

export function subscribeDataUpdated(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = () => handler();
  window.addEventListener(DATA_UPDATED_EVENT, listener);
  return () => window.removeEventListener(DATA_UPDATED_EVENT, listener);
}

/** Bridge domain-specific events into one subscription for dashboard widgets. */
export function wireDataSyncEvents(): void {
  if (typeof window === "undefined" || wired) return;
  wired = true;
  window.addEventListener(ACTIVITY_UPDATED_EVENT, () => notifyDataUpdated());
  window.addEventListener(ADMISSIONS_UPDATED_EVENT, () => notifyDataUpdated());
}
