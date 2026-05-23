import { Link } from "react-router-dom";
import { BookOpen, ExternalLink, FlaskConical, TrendingUp } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";

const TRADING_LAB_URL = "http://127.0.0.1:8081";

export function TradingLabPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 md:p-8">
      <section className="stagger-item space-y-3">
        <Badge>Lab</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
          Trading Lab
        </h1>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          A sandbox for applying what you learn — paper trade, replay scenarios, and experiment
          with strategies without risking real capital. Pair the curriculum with hands-on practice
          before you go live.
        </p>
      </section>

      <div className="stagger-item space-y-3">
        <Link to="/subjects/trading" className="block">
          <Card className="transition hover:border-[var(--accent-border)]">
            <div className="flex items-start gap-3">
              <TrendingUp size={20} className="text-[var(--warning)]" />
              <div className="min-w-0 space-y-1">
                <div className="font-semibold text-[var(--text-heading)]">
                  Trading &amp; Markets curriculum
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  Skill tree, lessons, and quizzes — build the foundation before you open the lab.
                </p>
              </div>
              <BookOpen size={16} className="ml-auto shrink-0 text-[var(--text-muted)]" />
            </div>
          </Card>
        </Link>

        <Card className="transition hover:border-[var(--accent-border)]">
          <div className="flex items-start gap-3">
            <FlaskConical size={20} className="text-[var(--accent)]" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="space-y-1">
                <div className="font-semibold text-[var(--text-heading)]">Open Trading Lab</div>
                <p className="text-sm text-[var(--text-muted)]">
                  Launch the local lab app for charts, orders, and scenario replay.
                </p>
              </div>
              <a
                href={TRADING_LAB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="secondary" className="gap-2">
                  Open lab
                  <ExternalLink size={14} />
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
