import { Link } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  FlaskConical,
  GraduationCap,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  Row,
  Section,
} from "@/components/ui";
import { ROUTES } from "@/app/navigation";
import { getManifestEntry } from "@/curriculum";
import { CampusAdmissionsHub } from "@/features/campus/CampusAdmissionsHub";
import { CampusSchoolsSection } from "@/features/campus/CampusSchoolsSection";
import { useIsSimpleMode } from "@/lib/uiMode";

const SIMPLE_COLLEGE_LINKS = [
  { to: ROUTES.collegeChecklist, label: "Checklist", icon: ClipboardList },
  { to: ROUTES.essayTracker, label: "Essays", icon: FileText },
  { to: ROUTES.applicationPackage, label: "Application package", icon: GraduationCap },
] as const;

interface ServiceCard {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const coreServices: ServiceCard[] = [
  {
    to: "/campus/application",
    title: "Application package",
    description: "One college view — essays for that school plus the shared checklist.",
    icon: GraduationCap,
  },
  {
    to: "/campus/college-checklist",
    title: "College checklist",
    description: "FAFSA, counselor, SAT score send, essays, and custom deadlines.",
    icon: ClipboardList,
  },
  {
    to: "/campus/essay-tracker",
    title: "Essay tracker",
    description: "Common App and supplement prompts, draft status, and deadlines.",
    icon: FileText,
  },
  {
    to: "/campus/calculators",
    title: "Calculators",
    description: "Expected value and compound interest — standalone tools.",
    icon: Wrench,
  },
];

function buildStudyCards(): ServiceCard[] {
  const cards: ServiceCard[] = [];
  const satPrep = getManifestEntry("sat-prep");
  if (satPrep) {
    cards.push({
      to: `/subjects/${satPrep.id}`,
      title: satPrep.name,
      description:
        "August track, mistake log, official practice links, and optional in-app baseline.",
      icon: GraduationCap,
    });
  }
  const algoLab = getManifestEntry("algo-lab");
  if (algoLab) {
    cards.push({
      to: `/subjects/${algoLab.id}`,
      title: algoLab.name,
      description: algoLab.description,
      icon: FlaskConical,
    });
  }
  cards.push({
    to: "/lab/trading",
    title: "Trading Lab",
    description: "Paper trade, replay scenarios, and experiment without real capital.",
    icon: FlaskConical,
  });
  return cards;
}

export function CampusServicesPage() {
  const studyCards = buildStudyCards();
  const simpleMode = useIsSimpleMode();

  return (
    <PageContainer size="lg" className="space-y-7">
      <PageHeader
        title="College"
        subtitle={
          simpleMode
            ? "Deadlines and application work — switch to Full mode in Settings for calculators and labs."
            : "College deadlines, calculators, and subject labs — outside the daily Today loop."
        }
      />

      <CampusAdmissionsHub />

      <CampusSchoolsSection />

      {simpleMode ? (
        <Section eyebrow="College" title="Open next">
          <div className="flex flex-wrap gap-2">
            {SIMPLE_COLLEGE_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--bg-panel)] px-3 text-sm font-medium text-[var(--text-heading)] hover:border-[var(--rule-strong)] hover:text-[var(--accent)]"
              >
                <Icon size={14} aria-hidden />
                {label}
                <ArrowRight size={12} aria-hidden />
              </Link>
            ))}
          </div>
        </Section>
      ) : (
      <div className="grid gap-4 md:grid-cols-2">
        <Section eyebrow="College" title="Admissions workflow">
          <div className="space-y-2">
            {coreServices.map((card) => (
              <Row
                key={card.to}
                to={card.to}
                icon={<card.icon size={16} />}
                title={card.title}
                detail={card.description}
              />
            ))}
          </div>
          <Link
            to="/campus/college-checklist"
            className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Open checklist
            <ArrowRight size={13} aria-hidden />
          </Link>
        </Section>

        <Section eyebrow="Study" title="Subjects & labs">
          <div className="space-y-2">
            {studyCards.map((card) => (
              <Row
                key={card.to}
                to={card.to}
                icon={<card.icon size={16} />}
                title={card.title}
                detail={card.description}
              />
            ))}
          </div>
        </Section>
      </div>
      )}
    </PageContainer>
  );
}
