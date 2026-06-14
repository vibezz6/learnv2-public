/** SAT curriculum + study surfaces (off for public OSS / Vercel deploy). */
function readIncludeSat(): boolean {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env.VITE_INCLUDE_SAT !== "false";
  }
  if (typeof process !== "undefined" && process.env.VITE_INCLUDE_SAT !== undefined) {
    return process.env.VITE_INCLUDE_SAT !== "false";
  }
  return true;
}

export const includeSat = readIncludeSat();

export const SAT_SUBJECT_ID = "sat-prep";
export const SAT_TRACK_ID = "sat-august";
