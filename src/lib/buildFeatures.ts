export type AppProfile = "full" | "public";

function readEnv(key: string): string | undefined {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const value = import.meta.env[key];
    return typeof value === "string" ? value : undefined;
  }
  if (typeof process !== "undefined" && process.env[key] !== undefined) {
    return process.env[key];
  }
  return undefined;
}

function readAppProfile(): AppProfile {
  return readEnv("VITE_APP_PROFILE") === "public" ? "public" : "full";
}

export const appProfile: AppProfile = readAppProfile();

/** SAT curriculum + study surfaces (off for public profile). */
export const includeSat = appProfile === "full";

/** College / campus / admissions surfaces (off for public profile). */
export const includeCollege = appProfile === "full";

export const SAT_SUBJECT_ID = "sat-prep";
export const SAT_TRACK_ID = "sat-august";

export const FOUNDATION_SUBJECT_IDS = ["math", "cs", "probability"] as const;
export const FOUNDATION_TRACK_ID = "foundation";

export function isSubjectAllowed(id: string): boolean {
  if (appProfile === "full") return true;
  if (id === SAT_SUBJECT_ID) return false;
  return (FOUNDATION_SUBJECT_IDS as readonly string[]).includes(id);
}

export function isTrackAllowed(id: string): boolean {
  if (appProfile === "full") {
    return id !== SAT_TRACK_ID || includeSat;
  }
  return id === FOUNDATION_TRACK_ID;
}
