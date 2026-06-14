import { usePreferences, type UiMode } from "@/stores/preferences";

export function isSimpleMode(mode: UiMode): boolean {
  return mode === "simple";
}

export function useUiMode(): UiMode {
  return usePreferences((s) => s.uiMode);
}

export function useIsSimpleMode(): boolean {
  return usePreferences((s) => s.uiMode === "simple");
}
