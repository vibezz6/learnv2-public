import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, FileText, GraduationCap, Settings } from "lucide-react";
import { ROUTES } from "@/app/navigation";
import { listApplicationColleges } from "@/lib/applicationPackage";
import { Button, Card, Stat, Tag, Toolbar } from "@/components/ui";
import { ADMISSIONS_UPDATED_EVENT } from "@/lib/admissionsSync";
import {
  buildAdmissionsSummary,
  getBlockingApplicationItem,
} from "@/lib/admissionsSummary";

export function CampusAdmissionsHub() {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const bump = () => setRevision((r) => r + 1);
    window.addEventListener(ADMISSIONS_UPDATED_EVENT, bump);
    return () => window.removeEventListener(ADMISSIONS_UPDATED_EVENT, bump);
  }, []);

  const summary = useMemo(() => {
    void revision;
    return buildAdmissionsSummary();
  }, [revision]);

  const blocking = useMemo(() => {
    void revision;
    return getBlockingApplicationItem();
  }, [revision]);

  const packageHref = useMemo(() => {
    void revision;
    const colleges = listApplicationColleges();
    const first = colleges[0];
    if (!first) return ROUTES.applicationPackage;
    return `${ROUTES.applicationPackage}?college=${encodeURIComponent(first)}`;
  }, [revision]);

  if (blocking) {
    const tone = blocking.overdue ? "danger" : blocking.daysUntil === 0 ? "warning" : "warning";
    const dueLabel = blocking.overdue
      ? "Overdue"
      : blocking.daysUntil === 0
        ? "Due today"
        : `Due in ${blocking.daysUntil} day${blocking.daysUntil === 1 ? "" : "s"}`;
    return (
      <Card variant="primary" density="normal" className="min-w-0">
        <div className="flex items-center gap-2 border-b border-[var(--rule)] pb-3">
          <p className="eyebrow-mono">Blocking this week</p>
          <Tag tone={tone} size="sm" mono className="ml-auto">
            {dueLabel}
          </Tag>
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-base font-semibold text-[var(--text-heading)]">{blocking.title}</p>
          {blocking.detail ? (
            <p className="text-sm text-[var(--text-muted)]">{blocking.detail}</p>
          ) : null}
          {blocking.nextStep ? (
            <p className="text-sm text-[var(--text)]">
              <span className="font-mono text-xs text-[var(--text-muted)]">Next:</span>{" "}
              {blocking.nextStep}
            </p>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--rule)] pt-3">
          <Link to={blocking.href}>
            <Button>
              Open and update
              <ArrowRight size={14} aria-hidden />
            </Button>
          </Link>
          <SummaryStats
            checklistDone={summary.checklistDone}
            checklistTotal={summary.checklistTotal}
            checklistPct={summary.checklistPct}
            essaysTracked={summary.essaysTracked}
            essaysFinal={summary.essaysFinal}
            hasActivity={summary.hasActivity}
          />
        </div>
        <FooterToolbar packageHref={packageHref} />
      </Card>
    );
  }

  return (
    <Card variant="default" density="normal" className="min-w-0">
      <div className="flex items-center gap-2 border-b border-[var(--rule)] pb-3">
        <p className="eyebrow-mono">College applications</p>
      </div>
      <div className="mt-3">
        {summary.hasActivity ? (
          <SummaryStats
            checklistDone={summary.checklistDone}
            checklistTotal={summary.checklistTotal}
            checklistPct={summary.checklistPct}
            essaysTracked={summary.essaysTracked}
            essaysFinal={summary.essaysFinal}
            hasActivity={summary.hasActivity}
          />
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Track FAFSA, essays, and deadlines locally. Export or import from Settings when you switch
            browsers.
          </p>
        )}
      </div>
      <FooterToolbar packageHref={packageHref} />
    </Card>
  );
}

function SummaryStats({
  checklistDone,
  checklistTotal,
  checklistPct,
  essaysTracked,
  essaysFinal,
}: {
  checklistDone: number;
  checklistTotal: number;
  checklistPct: number;
  essaysTracked: number;
  essaysFinal: number;
  hasActivity: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <Stat
        label="Checklist"
        value={`${checklistDone}/${checklistTotal}`}
        sub={`${checklistPct}% complete`}
        size="sm"
      />
      <Stat label="Essays tracked" value={essaysTracked} size="sm" />
      <Stat label="Essays final" value={essaysFinal} size="sm" />
    </div>
  );
}

function FooterToolbar({ packageHref }: { packageHref: string }) {
  return (
    <Toolbar className="mt-4 border-t border-[var(--rule)] pt-3" density="tight">
      <Link to={packageHref}>
        <Button variant="secondary" size="sm">
          <GraduationCap size={14} aria-hidden />
          Package
        </Button>
      </Link>
      <Link to="/campus/college-checklist">
        <Button variant="secondary" size="sm">
          <ClipboardList size={14} aria-hidden />
          Checklist
        </Button>
      </Link>
      <Link to="/campus/essay-tracker">
        <Button variant="secondary" size="sm">
          <FileText size={14} aria-hidden />
          Essays
        </Button>
      </Link>
      <Link to="/settings#admissions-backup">
        <Button variant="ghost" size="sm">
          <Settings size={14} aria-hidden />
          Backup
        </Button>
      </Link>
    </Toolbar>
  );
}
