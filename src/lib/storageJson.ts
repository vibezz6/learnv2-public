import { recordStorageReadError } from "@/lib/storageErrors";
import { recordStorageFailure } from "@/lib/storageSafety";

function readJsonInternal<T>(
  storage: Storage,
  key: string,
  fallback: T,
  isValid: ((value: unknown) => value is T) | undefined,
  safe: boolean,
): T {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (isValid && !isValid(parsed)) {
      if (safe) recordStorageReadError(key, "Invalid shape", storage);
      return fallback;
    }
    return parsed as T;
  } catch (err) {
    if (safe) {
      const message = err instanceof Error ? err.message : "Parse failed";
      recordStorageReadError(key, message, storage);
      console.error(`[learnv2] Failed to parse ${key}:`, err);
    }
    return fallback;
  }
}

export function readJson<T>(
  storage: Storage,
  key: string,
  fallback: T,
  isValid?: (value: unknown) => value is T,
): T {
  return readJsonInternal(storage, key, fallback, isValid, false);
}

/** Logs parse failures to learnv2_storage_errors_v1 without clearing the corrupt key. */
export function readJsonSafe<T>(
  storage: Storage,
  key: string,
  fallback: T,
  isValid?: (value: unknown) => value is T,
): T {
  return readJsonInternal(storage, key, fallback, isValid, true);
}

export function readJsonArray<T>(
  storage: Storage,
  key: string,
  isValidItem: (value: unknown) => value is T,
): T[] {
  const parsed = readJson<unknown[]>(storage, key, [], Array.isArray);
  return parsed.filter(isValidItem);
}

export function readJsonArraySafe<T>(
  storage: Storage,
  key: string,
  isValidItem: (value: unknown) => value is T,
): T[] {
  const parsed = readJsonSafe<unknown[]>(storage, key, [], Array.isArray);
  return parsed.filter(isValidItem);
}

export function writeJson(storage: Storage, key: string, value: unknown): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    recordStorageFailure(key, "write");
    return false;
  }
}
