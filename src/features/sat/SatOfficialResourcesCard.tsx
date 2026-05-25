import { useCallback, useState, type FormEvent } from "react";
import { Calendar, ExternalLink, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card } from "@/components/ui";
import { SAT_PRETEST_DRAFT_1_ID } from "@/data/satPretestDraft1";
import { getLatestCompletedSatPretestAttempt } from "@/lib/satPretest";
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
  const draft1Done = !!getLatestCompletedSatPretestAttempt(SAT_PRETEST_DRAFT_1_ID);
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
    <Card id={id} variant="default" className="space-y-4 p-5">
      <div className="flex items-start gap-3">
        <GraduationCap className="mt-0.5 shrink-0 text-[var(--accent-2)]" size={20} aria-hidden />
        <div className="min-w-0 space-y-1">
          <h3 className="font-semibold text-[var(--text-heading)]">Official SAT practice</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Run timed work in Bluebook or Khan, then log the session here and add misses to your
            mistake log within 24 hours.
          </p>
        </div>
      </div>

      {!draft1Done ? (
        <div className="rounded-[var(--radius)] border border-[var(--accent-border)] bg-[var(--accent-bg)]/40 px-4 py-3">
          <p className="text-sm font-medium text-[var(--text-heading)]">Optional: Draft 1 baseline</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            One in-app diagnostic captures how you think before feedback. Official practice is your
            daily engine either way.
          </p>
          <Link to="/sat/pretest" className="mt-3 inline-flex">
            <Button variant="secondary" className="min-h-10">
              Take Draft 1 diagnostic
            </Button>
          </Link>
        </div>
      ) : null}

      <form onSubmit={handleLogSession} className="space-y-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)]/35 p-4">
        <p className="text-sm font-medium text-[var(--text-heading)]">Log a practice session</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-[var(--text-heading)]">Section</span>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as SatPracticeSection)}
              className="w-full rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text)]"
            >
              <option value="math">Math module</option>
              <option value="rw">Reading &amp; Writing</option>
              <option value="full">Full practice test</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-[var(--text-heading)]">Source</span>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as SatPracticeSource)}
              className="w-full rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text)]"
            >
              <option value="bluebook">Bluebook</option>
              <option value="khan">Khan Academy</option>
            </select>
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-[var(--text-heading)]">Notes (optional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Module 2 — rushed on inference"
            className="w-full rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text)]"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={missesLogged}
            onChange={(e) => setMissesLogged(e.target.checked)}
            className="h-4 w-4"
          />
          Misses logged in mistake log
        </label>
        {error ? <p className="text-sm text-[var(--warning)]">{error}</p> : null}
        <Button type="submit" variant="secondary" className="min-h-10">
          Save session
        </Button>
      </form>

      {latest ? (
        <p className="text-sm text-[var(--text-muted)]">
          Last session: <span className="font-medium text-[var(--text-heading)]">{latest.label}</span>
          {latest.note ? ` — ${latest.note}` : ""}
          {!latest.missesLogged ? (
            <>
              {" "}
              ·{" "}
              <Link to="/subjects/sat-prep#mistakes" className="text-[var(--accent-2)] hover:underline">
                Log misses now
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      {recent.length > 1 ? (
        <ul className="space-y-1 text-xs text-[var(--text-muted)]">
          {recent.slice(1).map((session) => (
            <li key={session.id}>
              {session.date}: {session.label}
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="space-y-2">
        {LINKS.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 no-underline transition hover:border-[var(--border-strong)]"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-[var(--text-heading)]">
                  {link.title}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                  {link.description}
                </span>
              </span>
              <ExternalLink
                size={14}
                className="mt-0.5 shrink-0 text-[var(--text-muted)]"
                aria-hidden
              />
            </a>
          </li>
        ))}
      </ul>

      <div className="flex items-start gap-2 rounded-[var(--radius)] border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-4 py-3">
        <Calendar size={16} className="mt-0.5 shrink-0 text-[var(--warning)]" aria-hidden />
        <p className="text-sm text-[var(--text-muted)]">
          <span className="font-medium text-[var(--text-heading)]">August 2026 test week:</span>{" "}
          sleep beats cramming. Run one full Bluebook practice test, review your mistake log
          categories, and keep study blocks short the two nights before test day.
        </p>
      </div>
    </Card>
  );
}
