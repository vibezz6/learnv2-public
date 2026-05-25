import { Link } from "react-router-dom";
import { BarChart3, TrendingUp, Wrench } from "lucide-react";
import { Card, PageContainer, PageHeader } from "@/components/ui";

const tools = [
  {
    to: "/tools/ev",
    title: "Expected value",
    description: "Weight outcomes by probability to see whether a bet is +EV over time.",
    icon: BarChart3,
    tone: "text-[var(--accent)]",
  },
  {
    to: "/tools/compound",
    title: "Compound interest",
    description: "Project growth from an initial investment, monthly contributions, and annual return.",
    icon: TrendingUp,
    tone: "text-[var(--success)]",
  },
] as const;

export function ToolsPage() {
  return (
    <PageContainer size="sm" className="space-y-6">
      <PageHeader
        eyebrow="Calculators"
        title="Calculators"
        subtitle="Standalone calculators from the curriculum — use them while studying or planning."
      />

      <div className="stagger-item space-y-3">
        {tools.map(({ to, title, description, icon: Icon, tone }) => (
          <Link key={to} to={to} className="block">
            <Card className="transition hover:border-[var(--accent-border)]">
              <div className="flex items-start gap-3">
                <Icon size={20} className={tone} />
                <div className="min-w-0 space-y-1">
                  <div className="font-semibold text-[var(--text-heading)]">{title}</div>
                  <p className="text-sm text-[var(--text-muted)]">{description}</p>
                </div>
                <Wrench size={16} className="ml-auto shrink-0 text-[var(--text-muted)]" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
