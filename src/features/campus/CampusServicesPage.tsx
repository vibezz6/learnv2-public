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
import { Card, PageContainer, PageHeader } from "@/components/ui";
import { getManifestEntry } from "@/curriculum";
import { CampusAdmissionsHub } from "@/features/campus/CampusAdmissionsHub";

type ServiceCard = {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
};

function buildServiceCards(): ServiceCard[] {
  const cards: ServiceCard[] = [
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
      to: "/lab/trading",
      title: "Trading Lab",
      description:
        "Paper trade, replay scenarios, and experiment with strategies without risking real capital.",
      icon: FlaskConical,
      tone: "text-[var(--accent)]",
    },
    {
      to: "/campus/calculators",
      title: "Calculators",
      description:
        "Expected value and compound interest — standalone tools from the curriculum.",
      icon: Wrench,
      tone: "text-[var(--success)]",
    },
  ];

  const satPrep = getManifestEntry("sat-prep");
  if (satPrep) {
    cards.push({
      to: `/subjects/${satPrep.id}`,
      title: satPrep.name,
      description: satPrep.description,
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

const services = buildServiceCards();

export function CampusServicesPage() {
  return (
    <PageContainer size="sm" className="space-y-6">
      <PageHeader
        title="Campus"
        subtitle="Calculators, labs, and practice tools — everything outside the main lesson flow."
      />

      <div className="stagger-item">
        <CampusAdmissionsHub />
      </div>

      <div className="stagger-item space-y-3">
        {services.map(({ to, title, description, icon: Icon, tone }) => (
          <Link key={to} to={to} className="block">
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
        ))}
      </div>
    </PageContainer>
  );
}
