/** App semver — bump via `npm run version:bump` after each shippable release. */
export const APP_VERSION = "2.0.18";

/**
 * Scheme: 2.0.1 → … → 2.0.99 → 2.1.0 → … → 2.1.99 → 2.2.0
 * Patch increments every release; at .99 the next bump rolls minor and resets patch to 0.
 */

export function formatAppVersion(version = APP_VERSION): string {
  return `v${version}`;
}
