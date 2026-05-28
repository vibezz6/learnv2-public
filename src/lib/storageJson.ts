export function readJson<T>(
  storage: Storage,
  key: string,
  fallback: T,
  isValid?: (value: unknown) => value is T,
): T {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (isValid && !isValid(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function readJsonArray<T>(
  storage: Storage,
  key: string,
  isValidItem: (value: unknown) => value is T,
): T[] {
  const parsed = readJson<unknown[]>(storage, key, [], Array.isArray);
  return parsed.filter(isValidItem);
}

export function writeJson(storage: Storage, key: string, value: unknown): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
