/**
 * Ranked SAT mistake drill queue. Cooldown uses optional `drilledAt` on each
 * {@link SatMistakeEntry} in learnv2_sat_mistakes_v1 (single source — no sibling key).
 */
import { getEntrySkillId, listMistakes, markMistakeDrilled, type SatMistakeEntry } from "@/lib/satMistakeLog";
import { getSkillMeta, type SatSkillId } from "@/lib/satSkills";

export const DRILL_COOLDOWN_MS = 48 * 60 * 60 * 1000;

export interface DrillQueueRow {
  skillId: SatSkillId;
  label: string;
  count: number;
  latestAt: number;
  nodeId?: string;
  entryIds: string[];
}

export interface DrillCooldownRow {
  skillId: SatSkillId;
  label: string;
  cooldownEndsAt: number;
  hoursLeft: number;
}

function isOnCooldown(entry: SatMistakeEntry, now: number): boolean {
  return typeof entry.drilledAt === "number" && now - entry.drilledAt < DRILL_COOLDOWN_MS;
}

/** Top mistake skills grouped by skillId, excluding 48h drilled cooldown. */
export function getDrillQueue(limit = 5, storage: Storage = localStorage, now = Date.now()): DrillQueueRow[] {
  const bySkill = new Map<SatSkillId, DrillQueueRow>();

  for (const entry of listMistakes(storage)) {
    if (isOnCooldown(entry, now)) continue;
    const skillId = getEntrySkillId(entry);
    if (!skillId) continue;

    const existing = bySkill.get(skillId);
    if (!existing) {
      bySkill.set(skillId, {
        skillId,
        label: getSkillMeta(skillId).label,
        count: 1,
        latestAt: entry.createdAt,
        nodeId: entry.nodeId,
        entryIds: [entry.id],
      });
      continue;
    }
    existing.count += 1;
    if (entry.createdAt > existing.latestAt) {
      existing.latestAt = entry.createdAt;
      if (entry.nodeId) existing.nodeId = entry.nodeId;
    }
    existing.entryIds.push(entry.id);
  }

  return [...bySkill.values()]
    .sort((a, b) => b.count - a.count || b.latestAt - a.latestAt)
    .slice(0, limit);
}

/** Skills fully on 48h cooldown (no active queue row) for transparent SAT hub UI. */
export function getDrillCooldownRows(
  limit = 3,
  storage: Storage = localStorage,
  now = Date.now(),
): DrillCooldownRow[] {
  const bySkill = new Map<
    SatSkillId,
    { onCooldown: SatMistakeEntry[]; active: SatMistakeEntry[] }
  >();

  for (const entry of listMistakes(storage)) {
    const skillId = getEntrySkillId(entry);
    if (!skillId) continue;
    const bucket = bySkill.get(skillId) ?? { onCooldown: [], active: [] };
    if (isOnCooldown(entry, now)) bucket.onCooldown.push(entry);
    else bucket.active.push(entry);
    bySkill.set(skillId, bucket);
  }

  const rows: DrillCooldownRow[] = [];
  for (const [skillId, { onCooldown, active }] of bySkill) {
    if (active.length > 0 || onCooldown.length === 0) continue;
    const latestDrilled = Math.max(
      ...onCooldown.map((e) => (typeof e.drilledAt === "number" ? e.drilledAt : 0)),
    );
    const cooldownEndsAt = latestDrilled + DRILL_COOLDOWN_MS;
    if (cooldownEndsAt <= now) continue;
    const hoursLeft = Math.max(1, Math.ceil((cooldownEndsAt - now) / (60 * 60 * 1000)));
    rows.push({
      skillId,
      label: getSkillMeta(skillId).label,
      cooldownEndsAt,
      hoursLeft,
    });
  }

  return rows.sort((a, b) => a.cooldownEndsAt - b.cooldownEndsAt).slice(0, limit);
}

export function formatDrillCooldownLabel(hoursLeft: number): string {
  if (hoursLeft <= 1) return "On cooldown · try again in about 1h";
  return `On cooldown · try again in ${hoursLeft}h`;
}

export function markSkillDrilled(skillId: SatSkillId, storage: Storage = localStorage, now = Date.now()): void {
  for (const entry of listMistakes(storage)) {
    if (getEntrySkillId(entry) === skillId) markMistakeDrilled(entry.id, now, storage);
  }
}
