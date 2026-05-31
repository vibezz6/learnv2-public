import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { ROUTES } from "@/app/navigation";
import { formatPackageDeadline } from "@/lib/applicationPackage";
import {
  addCollege,
  countEssaysForCollege,
  discoverCollegesFromEssays,
  importCollegesFromEssays,
  loadColleges,
  removeCollege,
  updateCollegeDeadline,
  type CollegesState,
} from "@/lib/colleges";
import { daysUntilDue } from "@/lib/campusAdmissionsNudges";
import { getChecklistProgress, loadCollegeChecklist } from "@/lib/collegeChecklist";
import { Button, Card, Field, Input, Section, Tag } from "@/components/ui";
import { ADMISSIONS_UPDATED_EVENT } from "@/lib/admissionsSync";

export function CampusSchoolsSection() {
  const [state, setState] = useState<CollegesState>(() => loadColleges());
  const [revision, setRevision] = useState(0);
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [dismissImport, setDismissImport] = useState(false);

  const refresh = useCallback(() => {
    setState(loadColleges());
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
    setState(addCollege(name, deadline || undefined));
    setName("");
    setDeadline("");
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

      {state.colleges.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          Add your first school to see deadlines and essays per school.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {state.colleges.map((college) => {
            const days =
              college.deadline != null ? daysUntilDue(college.deadline, new Date()) : null;
            const badge = formatPackageDeadline(days);
            const essayCount = countEssaysForCollege(college.name);
            return (
              <li key={college.id}>
                <Card variant="default" density="normal" className="flex h-full min-w-0 flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-semibold text-[var(--text-heading)]">{college.name}</p>
                    <button
                      type="button"
                      className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                      aria-label={`Remove ${college.name}`}
                      onClick={() => {
                        if (window.confirm(`Remove ${college.name} from your list? Essays stay tagged.`)) {
                          setState(removeCollege(college.id));
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <Tag tone={badge.tone === "overdue" ? "danger" : badge.tone === "muted" ? "muted" : "accent"} size="sm">
                    {badge.label}
                  </Tag>
                  <p className="text-xs text-[var(--text-muted)]">
                    {essayCount} essay{essayCount === 1 ? "" : "s"} · Shared checklist {checklistPct}%
                  </p>
                  <Field label="Deadline" htmlFor={`deadline-${college.id}`}>
                    {(id) => (
                      <Input
                        id={id}
                        type="date"
                        value={college.deadline ?? ""}
                        onChange={(e) =>
                          setState(updateCollegeDeadline(college.id, e.target.value))
                        }
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
        <div className="grid gap-3 sm:grid-cols-2">
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
        </div>
        <Button size="sm" onClick={handleAdd} disabled={!name.trim()}>
          <Plus size={14} aria-hidden />
          Add school
        </Button>
      </Card>
    </Section>
  );
}
