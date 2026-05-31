import { readJson, writeJson } from "@/lib/storageJson";

export const STORAGE_ERRORS_KEY = "learnv2_storage_errors_v1";
const MAX_ENTRIES = 10;

export interface StorageErrorEntry {
  key: string;
  timestamp: string;
  error: string;
}

export function loadStorageErrors(storage: Storage = localStorage): StorageErrorEntry[] {
  return readJson<StorageErrorEntry[]>(storage, STORAGE_ERRORS_KEY, [], Array.isArray);
}

export function recordStorageReadError(
  key: string,
  error: string,
  storage: Storage = localStorage,
): void {
  const prev = loadStorageErrors(storage);
  const next: StorageErrorEntry[] = [
    { key, timestamp: new Date().toISOString(), error },
    ...prev.filter((e) => e.key !== key),
  ].slice(0, MAX_ENTRIES);
  writeJson(storage, STORAGE_ERRORS_KEY, next);
}

export function clearStorageErrors(storage: Storage = localStorage): void {
  storage.removeItem(STORAGE_ERRORS_KEY);
}
