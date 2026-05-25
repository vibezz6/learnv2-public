import { Link } from "react-router-dom";
import {
  ChevronRight,
  ClipboardList,
  FileText,
  FlaskConical,
  GraduationCap,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, PageContainer, PageHeader, Section } from "@/components/ui";
import { getManifestEntry } from "@/curriculum";
import { CampusAdmissionsHub } from "@/features/campus/CampusAdmissionsHub";

type ServiceCard = {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
};

const coreServices: ServiceCard[] = [
  {
    to: "/campus/college-checklist",
    title: "College checklist",
    description:
      "FAFSA, counselor, SAT score send, essays, and custom deadlines — admissions paperwork in one place.",
    icon: ClipboardList,
    tone: "text-[var(--accent-2)]",
  },
  {
    to: "/campus/essay-tracker",
    title: "Essay tracker",
    description:
      "Common App and supplement prompts, draft status (outline → final), and per-college deadlines.",
    icon: FileText,
    tone: "text-[var(--accent)]",
  },
  {
    to: "/campus/calculators",
    title: "Calculators",
    description: "Expected value and compound interest — standalone tools from the curriculum.",
    icon: Wrench,
    tone: "text-[var(--success)]",
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
        "August track, mistake log, official practice links, and optional in-app baseline — start here for SAT study.",
      icon: GraduationCap,
      tone: "text-[var(--accent-2)]",
    });
  }

  const algoLab = getManifestEntry("algo-lab");
  if (algoLab) {
    cards.push({
      to: `/subjects/${algoLab.id}`,
      title: algoLab.name,
      description: algoLab.description,
      icon: FlaskConical,
      tone: "text-[#6366f1]",
    });
  }

  return cards;
}

function ServiceCardLink({ to, title, description, icon: Icon, tone }: ServiceCard) {
  return (
    <Link to={to} className="block">
      <Card className="transition hover:border-[var(--accent-border)]">
        <div className="flex items-start gap-3">
          <Icon size={20} className={tone} />
          <div className="min-w-0 space-y-1">
            <div className="font-semibold text-[var(--text-heading)]">{title}</div>
            <p className="text-sm text-[var(--text-muted)]">{description}</p>
          </div>
          <ChevronRight size={16} className="ml-auto shrink-0 text-[var(--text-muted)]" />
        </div>
      </Card>
    </Link>
  );
}

export function CampusServicesPage() {
  const studyCards = buildStudyCards();

  return (
    <PageContainer size="sm" className="space-y-8">
      <PageHeader
        title="Campus"
        subtitle="College deadlines, calculators, and subject labs — outside your daily Today loop."
      />

      <Section eyebrow="Applications" title="College">
        <CampusAdmissionsHub />
        <div className="space-y-3">
          {coreServices.map((card) => (
            <ServiceCardLink key={card.to} {...card} />
          ))}
        </div>
      </Section>

      <Section eyebrow="Study" title="Subjects & labs">
        <div className="space-y-3">
          {studyCards.map((card) => (
            <ServiceCardLink key={card.to} {...card} />
          ))}
          <ServiceCardLink
            to="/lab/trading"
            title="Trading Lab"
            description="Paper trade, replay scenarios, and experiment with strategies without risking real capital."
            icon={FlaskConical}
            tone="text-[var(--accent)]"
          />
        </div>
      </Section>
    </PageContainer>
  );
}
