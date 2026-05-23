import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { manifest } from "@/curriculum";
import { loadAllSubjects } from "@/curriculum/loader";
import type { Subject } from "@/curriculum/types";
import { Button, Card, EmptyState } from "@/components/ui";
import { summarizeSubjectProgress } from "@/lib/subjectProgress";
import { useProgress } from "@/stores/progress";
import { cn } from "@/lib/cn";

type SortMode = "progress" | "name";

export function SubjectsPage() {
  const getNodeStatus = useProgress((s) => s.getNodeStatus);
  const progressNodes = useProgress((s) => s.data.nodes);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [query, setQuery] = useState("");
  const [filterId, setFilterId] = useState("all");
  const [sort, setSort] = useState<SortMode>("progress");

  useEffect(() => {
    loadAllSubjects().then(setSubjects);
  }, []);

  const summaries = useMemo(() => {
    const map = new Map<string, ReturnType<typeof summarizeSubjectProgress>>();
    for (const subject of subjects) {
      map.set(subject.id, summarizeSubjectProgress(subject, getNodeStatus));
    }
    return map;
  }, [subjects, getNodeStatus, progressNodes]);

  const filtered = useMemo(() => {
    let list = manifest.filter((entry) => {
      if (filterId !== "all" && entry.id !== filterId) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.id.toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const pa = summaries.get(a.id)?.pct ?? 0;
      const pb = summaries.get(b.id)?.pct ?? 0;
      return pb - pa || a.name.localeCompare(b.name);
    });

    return list;
  }, [filterId, query, sort, summaries]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      <header className="space-y-1 border-b border-[var(--border)] pb-5">
        <p className="font-mono text-xs text-[var(--text-muted)]">{manifest.length} subjects</p>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-heading)] md:text-3xl">
          Subjects
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Pick a track and work through its skill tree.</p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects…"
            className="h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] pl-9 pr-3 text-sm outline-none focus:border-[var(--accent-border)]"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="h-10 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--text-muted)] outline-none"
          aria-label="Sort subjects"
        >
          <option value="progress">Most progress</option>
          <option value="name">A–Z</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterPill active={filterId === "all"} onClick={() => setFilterId("all")}>
          All
        </FilterPill>
        {manifest.map((entry) => (
          <FilterPill
            key={entry.id}
            active={filterId === entry.id}
            onClick={() => setFilterId(entry.id)}
          >
            {entry.name.split(" ")[0]}
          </FilterPill>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((entry) => {
          const summary = summaries.get(entry.id);
          const next = summary?.nextNode;
          const pct = summary?.pct ?? 0;

          return (
            <Card key={entry.id} hover className="flex h-full flex-col">
              <Link to={`/subjects/${entry.id}`} className="min-w-0 flex-1">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: entry.color }}
                      aria-hidden
                    />
                    <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                      {entry.id}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
                    {pct}%
                  </span>
                </div>
                <h2 className="text-base font-medium text-[var(--text-heading)]">{entry.name}</h2>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
                {entry.description}
              </p>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--border)]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: entry.color }}
                  />
                </div>
                <p className="mt-2 font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
                  {summary?.completed ?? 0}/{entry.nodeCount} lessons
                </p>
              </Link>
              {next && (
                <Link to={`/subjects/${entry.id}/${next.id}`} className="mt-4 block">
                  <Button variant="secondary" className="h-9 w-full text-sm">
                    Continue
                    <ArrowRight size={14} />
                  </Button>
                </Link>
              )}
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card variant="quiet">
          <EmptyState
            title="No matches"
            description="Try a different search or clear filters to see the full curriculum."
            actionLabel="Show all subjects"
            onAction={() => {
              setQuery("");
              setFilterId("all");
            }}
          />
        </Card>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-[var(--border-strong)] bg-[var(--bg-hover)] text-[var(--text-heading)]"
          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]",
      )}
    >
      {children}
    </button>
  );
}
