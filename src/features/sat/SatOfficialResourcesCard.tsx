import { Calendar, ExternalLink, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui";

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
  return (
    <Card id={id} variant="default" className="space-y-4 p-5">
      <div className="flex items-start gap-3">
        <GraduationCap className="mt-0.5 shrink-0 text-[var(--accent-2)]" size={20} aria-hidden />
        <div className="min-w-0 space-y-1">
          <h3 className="font-semibold text-[var(--text-heading)]">Official SAT practice</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Pair Learn v2 lessons with College Board and Khan — log misses in your mistake log
            within 24 hours so retarget drills stay focused.
          </p>
        </div>
      </div>

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
