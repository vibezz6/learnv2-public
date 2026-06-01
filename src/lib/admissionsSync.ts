/** Fired when college checklist or essay tracker localStorage changes (same tab). */
export const ADMISSIONS_UPDATED_EVENT = "learnv2-admissions-updated";

export function notifyAdmissionsUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMISSIONS_UPDATED_EVENT));
}
