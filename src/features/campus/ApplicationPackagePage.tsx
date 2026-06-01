import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, CalendarClock, Check, FileText } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Meter,
  PageContainer,
  PageHeader,
  Select,
  Tag,
} from "@/components/ui";
import { ROUTES } from "@/app/navigation";
import { ADMISSIONS_UPDATED_EVENT } from "@/lib/admissionsSync";
import {
  buildApplicationPackage,
  formatPackageDeadlineAriaLabel,
  listApplicationColleges,
  resolveApplicationCollege,
} from "@/lib/applicationPackage";
import {
  COLLEGE_NOTES_DISPLAY_MAX,
  findCollegeByName,
  markCollegeSubmitted,
} from "@/lib/colleges";
import {
  ESSAY_STATUS_LABELS,
  ESSAY_STATUS_ORDER,
  loadEssayTracker,
  updateEssayStatus,
  saveEssayTracker,
  type EssayDraftStatus,
} from "@/lib/essayTracker";
import { TransientBanner } from "@/components/TransientBanner";
import { useTransientMessage } from "@/hooks/useTransientMessage";
import {
  loadCollegeChecklist,
  saveCollegeChecklist,
  toggleBuiltInItem,
  toggleCustomItem,
  type CollegeChecklistState,
} from "@/lib/collegeChecklist";
import { cn } from "@/lib/cn";

function deadlineTagTone(
  tone: "muted" | "active" | "overdue",
): "muted" | "accent" | "warning" | "danger" {
  if (tone === "overdue") return "danger";
  if (tone === "muted") return "muted";
  if (tone === "active") return "accent";
  return "accent";
}

function formatSubmittedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ApplicationPackagePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [revision, setRevision] = useState(0);
  const [checklist, setChecklist] = useState<CollegeChecklistState>(() => loadCollegeChecklist());
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const bump = () => {
      setRevision((r) => r + 1);
      setChecklist(loadCollegeChecklist());
    };
    window.addEventListener(ADMISSIONS_UPDATED_EVENT, bump);
    return () => window.removeEventListener(ADMISSIONS_UPDATED_EVENT, bump);
  }, []);

  const colleges = useMemo(() => {
    void revision;
    return listApplicationColleges();
  }, [revision]);

  const collegeParam = searchParams.get("college");
  const college = useMemo(
    () => resolveApplicationCollege(colleges, collegeParam),
    [colleges, collegeParam, revision],
  );

  const pkg = useMemo(() => {
    if (!college) return null;
    return buildApplicationPackage(college, { checklist });
  }, [college, checklist, revision]);

  const registryEntry = useMemo(() => {
    void revision;
    return college ? findCollegeByName(college) : undefined;
  }, [college, revision]);

  const isSubmitted = Boolean(registryEntry?.submittedAt);

  const registryNotesLabel = useMemo(() => {
    const notes = registryEntry?.notes?.trim();
    if (!notes) return null;
    const short =
      notes.length > COLLEGE_NOTES_DISPLAY_MAX
        ? `${notes.slice(0, COLLEGE_NOTES_DISPLAY_MAX)}…`
        : notes;
    return { short, full: notes };
  }, [registryEntry]);

  useEffect(() => {
    if (college && titleRef.current) titleRef.current.focus();
  }, [college]);

  const { message: savedMessage, showMessage: showSaved } = useTransientMessage();

  const persistChecklist = useCallback(
    (next: CollegeChecklistState) => {
      setChecklist(next);
      saveCollegeChecklist(next);
      showSaved("Saved");
    },
    [showSaved],
  );

  const handleEssayStatus = useCallback(
    (essayId: string, status: EssayDraftStatus) => {
      const next = updateEssayStatus(loadEssayTracker(), essayId, status);
      saveEssayTracker(next);
      setRevision((r) => r + 1);
      showSaved("Saved");
    },
    [showSaved],
  );

  const handleCollegeChange = (value: string) => {
    setSearchParams({ college: encodeURIComponent(value) }, { replace: true });
  };

  if (!college || !pkg) {
    return (
      <PageContainer size="lg" className="space-y-7">
        <PageHeader
          backTo={{ to: ROUTES.college, label: "College" }}
          eyebrow="Applications"
          title="Application package"
          subtitle="Pick a school to see essays and shared checklist progress for that application."
        />
        <EmptyState
          title="Pick a school"
          description="Open College to add schools or tag essays with a college name, then return here with a school selected."
          actionLabel="Go to College"
          actionTo={ROUTES.college}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="lg" className="space-y-7">
      <PageHeader
        backTo={{ to: ROUTES.college, label: "College" }}
        eyebrow="Applications"
        title={`Application package — ${college}`}
        subtitle="Essays for this school plus the shared checklist you use for every application."
      />

      {colleges.length > 1 ? (
        <Field label="College" htmlFor="application-college">
          {(id) => (
            <Select
              id={id}
              value={college}
              onChange={(e) => handleCollegeChange(e.target.value)}
            >
              {colleges.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ) : null}

      <Card variant="primary" density="roomy" className="min-w-0 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow-mono">College</p>
            <h2
              ref={titleRef}
              tabIndex={-1}
              className="mt-1 text-2xl font-semibold text-[var(--text-heading)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {college}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {registryNotesLabel ? (
              <Tag tone="muted" size="sm" title={registryNotesLabel.full}>
                {registryNotesLabel.short}
              </Tag>
            ) : null}
            {!isSubmitted ? (
              <Tag
                tone={deadlineTagTone(pkg.deadline.tone)}
                size="sm"
                className="inline-flex items-center gap-1"
                aria-label={formatPackageDeadlineAriaLabel(pkg.deadline)}
              >
                <CalendarClock size={12} aria-hidden />
                {pkg.deadline.label}
              </Tag>
            ) : null}
            {registryEntry && !registryEntry.submittedAt ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  markCollegeSubmitted(registryEntry.id);
                  setRevision((r) => r + 1);
                  showSaved("Marked submitted");
                }}
              >
                Mark submitted
              </Button>
            ) : registryEntry?.submittedAt ? (
              <Tag tone="success" size="sm">
                Submitted
              </Tag>
            ) : null}
          </div>
        </div>

        {isSubmitted && registryEntry?.submittedAt ? (
          <div
            className="rounded-[var(--radius-md)] border border-[var(--success-border)] bg-[var(--success-bg)] px-4 py-3"
            role="status"
          >
            <p className="text-sm font-semibold text-[var(--text-heading)]">
              Application submitted
            </p>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">
              Marked complete on {formatSubmittedDate(registryEntry.submittedAt)}. Essays and
              checklist stay editable for your records.
            </p>
          </div>
        ) : null}

        {pkg.doThisFirst && !isSubmitted ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--rule)] bg-[var(--bg-panel)] px-4 py-3">
            <p className="text-xs font-mono uppercase tracking-wide text-[var(--text-muted)]">
              Do this first
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-heading)]">
              {pkg.doThisFirst.title}
            </p>
            {pkg.doThisFirst.detail ? (
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">{pkg.doThisFirst.detail}</p>
            ) : null}
            <div className="mt-3">
              <Link to={pkg.doThisFirst.href}>
                <Button size="sm">
                  Open task
                  <ArrowRight size={14} aria-hidden />
                </Button>
              </Link>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="eyebrow-mono">Application checklist</p>
            <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Shared across schools
            </span>
          </div>
          <Meter
            value={pkg.checklistPct}
            label="Shared checklist progress"
            hint={`${pkg.checklistDone} of ${pkg.checklistTotal} done`}
            size="sm"
          />
          <ul className="space-y-2">
            {pkg.checklistRows.map((row) => (
              <li key={row.id}>
                <div
                  className={cn(
                    "flex min-h-11 gap-3 rounded-[var(--radius-md)] border border-[var(--rule)] bg-[var(--bg-panel)] px-4 py-2.5",
                    row.done && "opacity-70",
                  )}
                >
                  <button
                    type="button"
                    aria-label={row.done ? "Mark incomplete" : "Mark complete"}
                    onClick={() =>
                      persistChecklist(
                        row.isCustom
                          ? toggleCustomItem(checklist, row.id, !row.done)
                          : toggleBuiltInItem(checklist, row.id, !row.done),
                      )
                    }
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border transition",
                      row.done
                        ? "border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent)]"
                        : "border-[var(--rule-strong)] text-transparent hover:border-[var(--accent-border)]",
                    )}
                  >
                    <Check size={13} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium text-[var(--text-heading)]",
                        row.done && "line-through",
                      )}
                    >
                      {row.title}
                    </p>
                    {row.dueDate ? (
                      <p className="text-xs text-[var(--text-muted)]">Due {row.dueDate}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {pkg.checklistHasMore ? (
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.collegeChecklist)}>
              View all checklist items
              <ArrowRight size={14} aria-hidden />
            </Button>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="eyebrow-mono">Required essays</p>
          {pkg.essays.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No essays linked to this school yet. Set <strong>college</strong> on an entry in the
              essay tracker to link one. Add schools in College to set a school-level deadline.
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {pkg.essays.map((essay) => (
                <li key={essay.id}>
                  <Card variant="default" density="normal" className="h-full min-w-0 space-y-3">
                    <Link
                      to={`${ROUTES.essayTracker}#essay-${essay.id}`}
                      className="text-sm font-semibold text-[var(--text-heading)] hover:text-[var(--accent)]"
                    >
                      {essay.title}
                    </Link>
                    <Field label="Status" htmlFor={`essay-status-${essay.id}`}>
                      {(id) => (
                        <Select
                          id={id}
                          value={essay.status}
                          onChange={(e) =>
                            handleEssayStatus(essay.id, e.target.value as EssayDraftStatus)
                          }
                        >
                          {ESSAY_STATUS_ORDER.map((s) => (
                            <option key={s} value={s}>
                              {ESSAY_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </Select>
                      )}
                    </Field>
                    {essay.dueDate ? (
                      <p className="text-xs text-[var(--text-muted)]">Due {essay.dueDate}</p>
                    ) : null}
                    {essay.wordLimit ? (
                      <p className="text-xs text-[var(--text-muted)]">— / {essay.wordLimit} words</p>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--rule)] pt-4">
          <Link to={ROUTES.essayTracker}>
            <Button variant="ghost" size="sm">
              Open essay tracker
              <FileText size={14} aria-hidden />
            </Button>
          </Link>
          <Link to={ROUTES.collegeChecklist}>
            <Button variant="secondary" size="sm">
              Open full checklist
              <ArrowRight size={14} aria-hidden />
            </Button>
          </Link>
        </div>
      </Card>
      <TransientBanner message={savedMessage} />
    </PageContainer>
  );
}
