import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Printer } from "lucide-react";
import { ROUTES } from "@/app/navigation";
import { buildAdmissionsSummary } from "@/lib/admissionsSummary";
import {
  DEFAULT_COLLEGE_CHECKLIST,
  getChecklistProgress,
  loadCollegeChecklist,
} from "@/lib/collegeChecklist";
import { daysUntilDue } from "@/lib/campusAdmissionsNudges";
import { listColleges } from "@/lib/colleges";
import { ESSAY_STATUS_LABELS, loadEssayTracker } from "@/lib/essayTracker";
import { Button, PageContainer, PageHeader } from "@/components/ui";

export function CampusPrintSummaryPage() {
  const generatedAt = useMemo(() => new Date(), []);
  const colleges = useMemo(() => listColleges(), []);
  const essays = useMemo(() => loadEssayTracker(), []);
  const checklist = useMemo(() => loadCollegeChecklist(), []);
  const summary = useMemo(() => buildAdmissionsSummary(checklist, essays), [checklist, essays]);
  const checklistProgress = useMemo(() => getChecklistProgress(checklist), [checklist]);

  const dateLabel = generatedAt.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const hasData = colleges.length > 0 || essays.essays.length > 0;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-summary-root, #print-summary-root * { visibility: visible; }
          #print-summary-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .print-hide { display: none !important; }
          .print-school-block { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
      <PageContainer size="lg" className="space-y-7 print:max-w-none">
        <div className="print-hide flex flex-wrap items-start justify-between gap-3">
          <PageHeader
            backTo={{ to: ROUTES.college, label: "Campus" }}
            eyebrow="Applications"
            title="Print summary"
            subtitle="One-page overview for parents or counselors. Use Print to save as PDF."
          />
          <Button size="sm" onClick={() => window.print()} aria-label="Opens print dialog">
            <Printer size={14} aria-hidden />
            Print
          </Button>
        </div>

        <div
          id="print-summary-root"
          className="space-y-8 rounded-[var(--radius-md)] border border-[var(--rule)] bg-[var(--bg-panel)] p-6 print:border-0 print:bg-white print:p-0 print:text-black"
          tabIndex={-1}
        >
          <header className="border-b border-[var(--rule)] pb-4 print:border-black">
            <h1
              tabIndex={-1}
              className="text-2xl font-semibold text-[var(--text-heading)] outline-none print:text-black"
            >
              Application summary
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)] print:text-black">
              Generated {dateLabel}
            </p>
          </header>

          {!hasData ? (
            <p className="text-sm text-[var(--text-muted)] print:text-black">
              Add a school or essay in Campus to populate this summary.
            </p>
          ) : (
            <>
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-heading)] print:text-black">
                  Schools
                </h2>
                <table className="mt-3 w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--rule)] print:border-black">
                      <th className="py-2 pr-3 font-medium">School</th>
                      <th className="py-2 pr-3 font-medium">Notes</th>
                      <th className="py-2 pr-3 font-medium">Deadline</th>
                      <th className="py-2 pr-3 font-medium">Days</th>
                      <th className="py-2 font-medium">Essays</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colleges.map((school) => {
                      const schoolEssays = essays.essays.filter(
                        (e) => e.college?.trim() === school.name,
                      );
                      const finalCount = schoolEssays.filter((e) => e.status === "final").length;
                      const days = school.deadline
                        ? daysUntilDue(school.deadline, generatedAt)
                        : null;
                      return (
                        <tr
                          key={school.id}
                          className="border-b border-[var(--rule)] print:border-black"
                        >
                          <td className="py-2 pr-3">{school.name}</td>
                          <td className="py-2 pr-3">{school.notes ?? "—"}</td>
                          <td className="py-2 pr-3">{school.deadline ?? "—"}</td>
                          <td className="py-2 pr-3">
                            {days === null
                              ? "—"
                              : days < 0
                                ? `${Math.abs(days)} overdue`
                                : `${days} left`}
                          </td>
                          <td className="py-2">
                            {finalCount}/{schoolEssays.length} final
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>

              {colleges.map((school) => {
                const schoolEssays = essays.essays.filter((e) => e.college?.trim() === school.name);
                if (schoolEssays.length === 0) return null;
                return (
                  <section key={school.id} className="print-school-block">
                    <h3 className="text-base font-semibold text-[var(--text-heading)] print:text-black">
                      {school.name}
                      {school.notes ? ` · ${school.notes}` : ""}
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm">
                      {schoolEssays.map((essay) => (
                        <li key={essay.id}>
                          {essay.title} — {ESSAY_STATUS_LABELS[essay.status]}
                          {essay.dueDate ? ` · due ${essay.dueDate}` : ""}
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}

              <section className="print-school-block">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-heading)] print:text-black">
                  Shared checklist ({checklistProgress.pct}%)
                </h2>
                <ul className="mt-3 space-y-1 text-sm">
                  {DEFAULT_COLLEGE_CHECKLIST.map((item) => (
                    <li key={item.id}>
                      {checklist.completed[item.id] ? "✓" : "○"} {item.title}
                    </li>
                  ))}
                  {checklist.customItems.map((item) => (
                    <li key={item.id}>
                      {item.completed ? "✓" : "○"} {item.title}
                      {item.dueDate ? ` (due ${item.dueDate})` : ""}
                    </li>
                  ))}
                </ul>
              </section>

              <p className="border-t border-[var(--rule)] pt-4 text-xs text-[var(--text-muted)] print:border-black print:text-black">
                Generated from Learn v2 · local data only · {summary.essaysTracked} essays tracked
              </p>
            </>
          )}
        </div>

        <p className="print-hide text-sm text-[var(--text-muted)]">
          <Link to={ROUTES.college} className="text-[var(--accent)] hover:underline">
            Back to Campus
          </Link>
        </p>
      </PageContainer>
    </>
  );
}
