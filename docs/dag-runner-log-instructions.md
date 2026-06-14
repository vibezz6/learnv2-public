# DAG runner — how to watch the live log

Use this when running copy-audit (or any) DAG via `~/.cursor/skills/dag-task-runner/scripts/run_dag.ts`.

## One-time setup

1. **API key** — keep it local (do not commit):

   ```bash
   export CURSOR_API_KEY=<your-local-agent-key>
   ```

   Or load from a gitignored env file in the repo root:

   ```bash
   set -a && source .env && set +a
   ```

2. **Runner deps** (first time only):

   ```bash
   cd ~/.cursor/skills/dag-task-runner/scripts && npm install
   ```

## Per run (e.g. Run A, B, C…)

Set variables (change `<run>` to `a`, `b`, `c`, …):

```bash
export RUNNER_DIR="$HOME/.cursor/skills/dag-task-runner/scripts"
export CWD="$PWD"
export CANVAS_PATH="$HOME/.cursor/projects/<your-cursor-project>/canvases/dag-learnv2-copy-<run>.canvas.tsx"
export DAG_PATH="/tmp/dag-learnv2-copy-<run>.json"
```

### Step 1 — Create the live log (canvas)

Parent agent writes `DAG_PATH`, then:

```bash
cd "$CWD"
[ -f .env ] && set -a && source .env && set +a

"$RUNNER_DIR/node_modules/.bin/tsx" "$RUNNER_DIR/run_dag.ts" \
  --init-only \
  --dag "$DAG_PATH" \
  --canvas-path "$CANVAS_PATH" \
  --cwd "$CWD"
```

**Open the log UI:** in Cursor, open the canvas file at `$CANVAS_PATH`.

Or from terminal (macOS):

```bash
open "$CANVAS_PATH"
```

You should see one card per task, all **PENDING**.

### Step 2 — Run subagents

```bash
[ -n "$CURSOR_API_KEY" ] || { echo "Set CURSOR_API_KEY first"; exit 1; }

"$RUNNER_DIR/node_modules/.bin/tsx" "$RUNNER_DIR/run_dag.ts" \
  --dag "$DAG_PATH" \
  --canvas-path "$CANVAS_PATH" \
  --cwd "$CWD" \
  --task-timeout-ms 900000
```

### What you see on the canvas (the log)

| Status | Meaning |
|--------|---------|
| **PENDING** | Not started yet |
| **RUNNING** | SDK subagent working; streamed text appears in the card |
| **FINISHED** | Done; read final output in the card |
| **ERROR** | Failed or timed out; downstream tasks may be skipped |

- Tasks in the **same rank** run **in parallel** (e.g. three audits at once).
- The next rank starts only when all parents in the previous rank finish.
- Stream text is capped (~4000 chars per card); full output is in the terminal when the runner exits.

### Step 3 — Tell the parent agent you are done

When the terminal command exits (success or failure), reply in chat:

- **`Run A done`** — audit spec ready for review
- **`Run B done`** — dashboard copy batch ready to commit
- etc.

The parent agent will `git diff`, run `npm run test && npm run build`, and commit **one batch per run** (not one mega release).

## If the runner fails immediately

| Message | Fix |
|---------|-----|
| `MISSING_CURSOR_API_KEY` | Export key or add to `.env` |
| `Could not find dag-task-runner/scripts` | Install skill under `~/.cursor/skills/dag-task-runner` or set `DAG_RUNNER_DIR` |
| Task **ERROR** / timeout | Re-run that batch only; or parent implements the task without DAG |

## Copy-audit batch map

| Run | DAG file | Canvas | Ships |
|-----|----------|--------|-------|
| A | `dag-learnv2-copy-a.json` | `dag-learnv2-copy-a.canvas.tsx` | `docs/sat-copy-audit.md` only |
| B | `...-b.json` | `...-b.canvas.tsx` | v2.0.41 dashboard strings |
| C | `...-c.json` | `...-c.canvas.tsx` | v2.0.42 SAT Prep hub |
| D | `...-d.json` | `...-d.canvas.tsx` | v2.0.43 Command palette |
| E | `...-e.json` | `...-e.canvas.tsx` | v2.0.44 pretest/settings labels |

Parent creates each `DAG_PATH` from the plan; you only need to open the matching canvas and say when the run finishes.
