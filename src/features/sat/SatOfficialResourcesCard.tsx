import { useCallback, useState, type FormEvent } from "react";
import { Calendar, ExternalLink, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card, Field, Input, Row, Select, Tag } from "@/components/ui";
import {
  addPracticeSession,
  getLatestPracticeSession,
  listPracticeSessions,
  type SatPracticeSection,
  type SatPracticeSource,
} from "@/lib/satPracticeLog";

const LINKS = [
  {
    title: "Bluebook",
    description: "Official digital practice — same interface as test day.",
    url: "https://bluebook.collegeboard.org/",
  },
  {
    title: "Khan Academy — SAT Math",
    description: "Skill drills and timed sets for Math modules.",
    url: "https://www.khanacademy.org/test-prep/sat/sat-math-practice",
  },
  {
    title: "Khan Academy — Reading & Writing",
    description: "Grammar, passages, and timed R&W practice.",
    url: "https://www.khanacademy.org/test-prep/sat/sat-reading-writing-practice",
  },
] as const;

interface Props {
  id?: string;
}

export function SatOfficialResourcesCard({ id }: Props) {
  const [revision, setRevision] = useState(0);
  const [section, setSection] = useState<SatPracticeSection>("math");
  const [source, setSource] = useState<SatPracticeSource>("bluebook");
  const [note, setNote] = useState("");
  const [missesLogged, setMissesLogged] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(() => setRevision((r) => r + 1), []);
  void revision;

  const latest = getLatestPracticeSession();
  const recent = listPracticeSessions().slice(0, 3);

  const handleLogSession = (event: FormEvent) => {
    event.preventDefault();
    const created = addPracticeSession({ section, source, note, missesLogged });
    if (!created) {
      setError("Could not save this practice session.");
      return;
    }
    setError("");
    setNote("");
    setMissesLogged(false);
    refresh();
  };

  return (
    <Card id={id} variant="default" density="normal" className="min-w-0 space-y-4">
      <div className="flex items-start gap-3 border-b border-[var(--rule)] pb-3">
        <GraduationCap className="mt-0.5 shrink-0 text-[var(--text-muted)]" size={16} aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="eyebrow-mono">Official SAT practice</p>
          <p className="text-sm text-[var(--text-muted)]">
            Run timed work in Bluebook or Khan, then log the session here and add misses to your
            mistake log within 24 hours.
          </p>
        </div>
      </div>

      <form onSubmit={handleLogSession} className="space-y-3 rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-canvas)] p-3">
        <p className="eyebrow-mono">Log a practice session</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Section">
            {(id) => (
              <Select
                id={id}
                value={section}
                onChange={(e) => setSection(e.target.value as SatPracticeSection)}
              >
                <option value="math">Math module</option>
                <option value="rw">Reading &amp; Writing</option>
                <option value="full">Full practice test</option>
              </Select>
            )}
          </Field>
          <Field label="Source">
            {(id) => (
              <Select
                id={id}
                value={source}
                onChange={(e) => setSource(e.target.value as SatPracticeSource)}
              >
                <option value="bluebook">Bluebook</option>
                <option value="khan">Khan Academy</option>
              </Select>
            )}
          </Field>
        </div>
        <Field label="Notes" hint="Optional">
          {(id) => (
            <Input
              id={id}
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Module 2 — rushed on inference"
            />
          )}
        </Field>
        <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={missesLogged}
            onChange={(e) => setMissesLogged(e.target.checked)}
            className="h-4 w-4 shrink-0 accent-[var(--accent)]"
          />
          Misses logged in mistake log
        </label>
        {error ? (
          <p className="text-sm text-[var(--danger-fg)]">{error}</p>
        ) : null}
        <Button type="submit" variant="secondary" size="sm">
          Save session
        </Button>
      </form>

      {latest ? (
        <p className="text-sm text-[var(--text-muted)]">
          Last session:{" "}
          <span className="font-medium text-[var(--text-heading)]">{latest.label}</span>
          {latest.note ? ` — ${latest.note}` : ""}
          {!latest.missesLogged ? (
            <>
              {" · "}
              <Link to="/subjects/sat-prep#mistakes" className="text-[var(--accent)] hover:underline">
                Log misses now
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      {recent.length > 1 ? (
        <ul className="space-y-1 font-mono text-[11px] text-[var(--text-subtle)]">
          {recent.slice(1).map((session) => (
            <li key={session.id}>
              <Tag tone="mono" size="sm" className="mr-1">
                {session.date}
              </Tag>
              {session.label}
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="space-y-2">
        {LINKS.map((link) => (
          <li key={link.url}>
            <Row
              to={link.url}
              external
              icon={<ExternalLink size={14} />}
              title={link.title}
              detail={link.description}
            />
          </li>
        ))}
      </ul>

      <div className="flex items-start gap-2 rounded-[var(--radius)] border border-[var(--warning-border)] bg-[var(--warning-bg)] px-3 py-2.5">
        <Calendar size={14} className="mt-0.5 shrink-0 text-[var(--warning-fg)]" aria-hidden />
        <p className="text-sm leading-relaxed text-[var(--text)]">
          <span className="font-medium text-[var(--text-heading)]">August 2026 test week:</span>{" "}
          sleep beats cramming. Run one full Bluebook practice test, review your mistake log
          categories, and keep study blocks short the two nights before test day.
        </p>
      </div>
    </Card>
  );
}
