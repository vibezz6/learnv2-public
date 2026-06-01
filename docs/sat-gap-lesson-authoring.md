# SAT gap lesson authoring (narrow batches)

Use this checklist when Cursor or a Draft 1 export recommends new `sat-prep` nodes.

## Before editing curriculum

1. Confirm gap evidence: completed Draft 1 export, or an imported `lessonPlan` in Learn v2.
2. Cap each batch at **3–5 new nodes** in [`src/curriculum/data/sat-prep.json`](../src/curriculum/data/sat-prep.json).
3. Update [`src/curriculum/data/manifest.json`](../src/curriculum/data/manifest.json) `nodeCount` for `sat-prep`.
4. Append new ids to [`src/data/tracks.ts`](../src/data/tracks.ts) `sat-august` only when the lesson belongs on the August track.
5. Run `npm run test` (manifest integrity + track integrity).

## Node guidelines

- Parent to the closest existing lesson (`parentIds`).
- Include `quiz` with at least one MC item when possible.
- Wire `relatedNodeIds` on Draft 1/2 pretest questions when retargeting that skill.
- Prefer **gap drill** naming: `Gap drill — <skill>` so the skill tree stays scannable.

## Proposed vs existing

The SAT Prep **Recommended** card shows `proposed_new` rows when `lessonPlan` references node ids not yet in `sat-prep.json`. Author those ids in a follow-up batch (v2.0.34+), then re-import or refresh the plan.

## Do not

- Add 10+ nodes in one commit without a gap list.
- Duplicate Khan/Bluebook content inside JSON (link out instead).
- Change lesson quiz or progress keys for unrelated subjects.
