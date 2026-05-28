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
import { getManifestEntry } from "@/curriculum";
import { CampusAdmissionsHub } from "@/features/campus/CampusAdmissionsHub";

interface ServiceCard {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const coreServices: ServiceCard[] = [
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

  return (
    <PageContainer size="lg" className="space-y-7">
      <PageHeader
        title="Campus"
        subtitle="College deadlines, calculators, and subject labs — outside the daily Today loop."
      />

      <CampusAdmissionsHub />

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
    </PageContainer>
  );
}
