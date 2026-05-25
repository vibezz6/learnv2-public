export const RECENT_COMMAND_ACTIONS_KEY = "learnv2_recent_cmd_actions_v1";
export const MAX_RECENT_COMMAND_ACTIONS = 6;

export interface RecentCommandAction {
  id: string;
  label: string;
  path: string;
  at: number;
}

function loadRaw(storage: Storage = localStorage): RecentCommandAction[] {
  try {
    const raw = storage.getItem(RECENT_COMMAND_ACTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RecentCommandAction =>
        !!item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.label === "string" &&
        typeof item.path === "string" &&
        typeof item.at === "number",
    );
  } catch {
    return [];
  }
}

export function getRecentCommandActions(storage: Storage = localStorage): RecentCommandAction[] {
  return loadRaw(storage).sort((a, b) => b.at - a.at).slice(0, MAX_RECENT_COMMAND_ACTIONS);
}

export function addRecentCommandAction(
  id: string,
  label: string,
  path: string,
  storage: Storage = localStorage,
): void {
  const trimmedLabel = label.trim();
  const trimmedPath = path.trim();
  if (!id || !trimmedLabel || !trimmedPath) return;

  const next: RecentCommandAction[] = [
    { id, label: trimmedLabel, path: trimmedPath, at: Date.now() },
    ...getRecentCommandActions(storage).filter((item) => item.id !== id),
  ].slice(0, MAX_RECENT_COMMAND_ACTIONS);

  try {
    storage.setItem(RECENT_COMMAND_ACTIONS_KEY, JSON.stringify(next));
  } catch {
    // quota exceeded
  }
}
