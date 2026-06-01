/**
 * Storage durability helpers (B01/B02).
 *
 * - Tracks write failures (quota exceeded, private mode) so the UI can warn the
 *   user to back up before progress is silently lost.
 * - Provides a safe zustand persist storage that quarantines unparseable values
 *   instead of letting a corrupt blob crash rehydrate / white-screen the app.
 *
 * No external deps so it is safe to import from low-level utilities.
 */

export type StorageFailureKind = "write" | "parse" | "probe";

export interface StorageStatus {
  ok: boolean;
  lastFailureAt: number;
  lastFailureKey: string | null;
  kind: StorageFailureKind | null;
}

export const STORAGE_STATUS_EVENT = "learnv2-storage-status";

let status: StorageStatus = { ok: true, lastFailureAt: 0, lastFailureKey: null, kind: null };

export function getStorageStatus(): StorageStatus {
  return status;
}

function dispatchStatus(): void {
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new Event(STORAGE_STATUS_EVENT));
  }
}

export function recordStorageFailure(key: string | null, kind: StorageFailureKind): void {
  status = { ok: false, lastFailureAt: Date.now(), lastFailureKey: key, kind };
  dispatchStatus();
}

/** Clear the failure flag after a successful recovery (e.g. a passing probe). */
export function clearStorageFailure(): void {
  if (status.ok) return;
  status = { ok: true, lastFailureAt: status.lastFailureAt, lastFailureKey: null, kind: null };
  dispatchStatus();
}

export function subscribeStorageStatus(handler: () => void): () => void {
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
    return () => {};
  }
  window.addEventListener(STORAGE_STATUS_EVENT, handler);
  return () => window.removeEventListener(STORAGE_STATUS_EVENT, handler);
}

/** Returns true if a tiny test write+read+remove succeeds. Records a failure if not. */
export function probeStorageWritable(storage: Storage = localStorage): boolean {
  const probeKey = "__learnv2_probe__";
  try {
    storage.setItem(probeKey, "1");
    const ok = storage.getItem(probeKey) === "1";
    storage.removeItem(probeKey);
    if (ok) clearStorageFailure();
    else recordStorageFailure(probeKey, "probe");
    return ok;
  } catch {
    recordStorageFailure(probeKey, "write");
    return false;
  }
}

/** Minimal string-based storage shape zustand's createJSONStorage expects. */
export interface StringStorage {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

/**
 * Wraps a Storage for zustand persist so that:
 * - a corrupt (unparseable) value is copied to `<key>_corrupt_<ts>` and removed,
 *   then null is returned so the store falls back to its defaults (no crash);
 * - a failed write is recorded (so the UI can warn) but never throws.
 */
export function createSafeStorage(storage: Storage = localStorage): StringStorage {
  return {
    getItem: (name) => {
      let raw: string | null;
      try {
        raw = storage.getItem(name);
      } catch {
        recordStorageFailure(name, "parse");
        return null;
      }
      if (raw == null) return null;
      try {
        JSON.parse(raw);
        return raw;
      } catch {
        // Quarantine the corrupt value instead of crashing rehydrate.
        try {
          storage.setItem(`${name}_corrupt_${Date.now()}`, raw);
          storage.removeItem(name);
        } catch {
          /* ignore quarantine failure */
        }
        recordStorageFailure(name, "parse");
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        storage.setItem(name, value);
      } catch {
        recordStorageFailure(name, "write");
      }
    },
    removeItem: (name) => {
      try {
        storage.removeItem(name);
      } catch {
        /* ignore */
      }
    },
  };
}
