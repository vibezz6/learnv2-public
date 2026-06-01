import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { ROUTES } from "@/app/navigation";
import { formatPackageDeadline } from "@/lib/applicationPackage";
import {
  COLLEGE_NOTES_MAX_LENGTH,
  addCollege,
  countEssaysForCollege,
  discoverCollegesFromEssays,
  importCollegesFromEssays,
  listColleges,
  markCollegeSubmitted,
  removeCollege,
  setCollegeArchived,
  updateCollegeDeadline,
  updateCollegeNotes,
} from "@/lib/colleges";
import { daysUntilDue } from "@/lib/campusAdmissionsNudges";
import { getEssayProgressForCollege } from "@/lib/essayTracker";
import { getChecklistProgress, loadCollegeChecklist } from "@/lib/collegeChecklist";
import { Button, Card, Field, Input, Section, Tag } from "@/components/ui";
import { ADMISSIONS_UPDATED_EVENT } from "@/lib/admissionsSync";

export function CampusSchoolsSection() {
  const [revision, setRevision] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [dismissImport, setDismissImport] = useState(false);

  const colleges = useMemo(() => {
    void revision;
    return listColleges(undefined, { includeArchived: showArchived });
  }, [revision, showArchived]);

  const hasArchivedColleges = useMemo(() => {
    void revision;
    return listColleges(undefined, { includeArchived: true }).some((c) => c.archived);
  }, [revision]);

  const refresh = useCallback(() => {
    setRevision((r) => r + 1);
  }, []);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener(ADMISSIONS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(ADMISSIONS_UPDATED_EVENT, handler);
  }, [refresh]);

  const discovered = useMemo(() => {
    void revision;
    return discoverCollegesFromEssays();
  }, [revision]);

  const checklistPct = useMemo(() => getChecklistProgress(loadCollegeChecklist()).pct, [revision]);

  const handleAdd = () => {
    if (!name.trim()) return;
    addCollege(name, deadline || undefined, notes || undefined);
    refresh();
    setName("");
    setDeadline("");
    setNotes("");
  };

  const handleImport = () => {
    importCollegesFromEssays();
    refresh();
    setDismissImport(true);
  };

  return (
    <Section eyebrow="Your schools" title="Application packages">
      {!dismissImport && discovered.length > 0 ? (
        <Card variant="primary" density="normal" className="min-w-0 space-y-3 border-[var(--accent-border)]">
          <p className="text-sm text-[var(--text-muted)]">
            We found {discovered.length} school{discovered.length === 1 ? "" : "s"} from your
            essays. Import them to set deadlines and open package views.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleImport}>
              Import {discovered.length} school{discovered.length === 1 ? "" : "s"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDismissImport(true)}>
              Dismiss
            </Button>
          </div>
        </Card>
      ) : null}

      {hasArchivedColleges ? (
        <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
      ) : null}

      {colleges.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          Add your first school to track deadlines and essays.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {colleges.map((college) => {
            const days =
              college.deadline != null ? daysUntilDue(college.deadline, new Date()) : null;
            const badge = formatPackageDeadline(days);
            const essayCount = countEssaysForCollege(college.name);
            const essayProgress = getEssayProgressForCollege(college.name);
            return (
              <li key={college.id}>
                <Card variant="default" density="normal" className="flex h-full min-w-0 flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-[var(--text-heading)]">{college.name}</p>
                      {college.notes ? (
                        <p
                          className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
                          title={college.notes}
                        >
                          {college.notes.length > 24
                            ? `${college.notes.slice(0, 24)}…`
                            : college.notes}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                      aria-label={`Remove ${college.name}`}
                      onClick={() => {
                        if (window.confirm(`Remove ${college.name} from your list? Essays stay tagged.`)) {
                          removeCollege(college.id);
                          refresh();
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Tag tone={badge.tone === "overdue" ? "danger" : badge.tone === "muted" ? "muted" : "accent"} size="sm">
                      {badge.label}
                    </Tag>
                    {college.submittedAt ? (
                      <Tag tone="success" size="sm">
                        Submitted
                      </Tag>
                    ) : null}
                    {college.archived ? (
                      <Tag tone="muted" size="sm">
                        Archived
                      </Tag>
                    ) : null}
                    {essayProgress.total > 0 ? (
                      <Tag
                        tone={essayProgress.finalCount === essayProgress.total ? "success" : "muted"}
                        size="sm"
                      >
                        {essayProgress.finalCount}/{essayProgress.total} essays final
                      </Tag>
                    ) : null}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {essayCount} essay{essayCount === 1 ? "" : "s"} · Shared checklist {checklistPct}%
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!college.submittedAt ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          markCollegeSubmitted(college.id);
                          refresh();
                        }}
                      >
                        Mark submitted
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          markCollegeSubmitted(college.id, false);
                          refresh();
                        }}
                      >
                        Undo submit
                      </Button>
                    )}
                    {college.submittedAt ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCollegeArchived(college.id, !college.archived);
                          refresh();
                        }}
                      >
                        {college.archived ? "Unarchive" : "Archive"}
                      </Button>
                    ) : null}
                  </div>
                  <Field label="Deadline" htmlFor={`deadline-${college.id}`}>
                    {(id) => (
                      <Input
                        id={id}
                        type="date"
                        value={college.deadline ?? ""}
                        onChange={(e) => {
                          updateCollegeDeadline(college.id, e.target.value);
                          refresh();
                        }}
                      />
                    )}
                  </Field>
                  <Field
                    label="Notes (optional)"
                    htmlFor={`notes-${college.id}`}
                    hint="Short label on package cards (e.g. ED, EA, RD) — not separate deadlines."
                  >
                    {(id) => (
                      <Input
                        id={id}
                        value={college.notes ?? ""}
                        maxLength={COLLEGE_NOTES_MAX_LENGTH}
                        placeholder="e.g. ED, EA, RD"
                        onChange={(e) => {
                          updateCollegeNotes(college.id, e.target.value);
                          refresh();
                        }}
                      />
                    )}
                  </Field>
                  <Link
                    to={`${ROUTES.applicationPackage}?college=${encodeURIComponent(college.name)}`}
                    className="mt-auto"
                  >
                    <Button variant="secondary" size="sm" className="w-full">
                      View package
                      <ArrowRight size={14} aria-hidden />
                    </Button>
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Card variant="default" density="normal" className="min-w-0 space-y-3">
        <p className="text-sm font-medium text-[var(--text-heading)]">Add school</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Name" htmlFor="new-college-name">
            {(id) => (
              <Input
                id={id}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Stanford University"
              />
            )}
          </Field>
          <Field label="Deadline (optional)" htmlFor="new-college-deadline">
            {(id) => (
              <Input
                id={id}
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            )}
          </Field>
          <Field
            label="Notes (optional)"
            htmlFor="new-college-notes"
            hint="Optional label shown next to this school's deadline (e.g. ED Nov 1, EA, RD)"
          >
            {(id) => (
              <Input
                id={id}
                value={notes}
                maxLength={COLLEGE_NOTES_MAX_LENGTH}
                placeholder="e.g. ED, EA, RD"
                onChange={(e) => setNotes(e.target.value)}
              />
            )}
          </Field>
        </div>
        <Button size="sm" onClick={handleAdd} disabled={!name.trim()}>
          <Plus size={14} aria-hidden />
          Add school
        </Button>
      </Card>
    </Section>
  );
}
