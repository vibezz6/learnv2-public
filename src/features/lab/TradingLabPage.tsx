import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ExternalLink, FlaskConical, TrendingUp } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import {
  type BacktestRunCard,
  fetchHealth,
  fetchLastBacktestRun,
  formatBacktestSummary,
  TRADING_JOURNAL_URL,
} from "./tradingLabApi";

type LabStatus = "checking" | "online" | "offline";

export function TradingLabPage() {
  const [status, setStatus] = useState<LabStatus>("checking");
  const [lastBacktest, setLastBacktest] = useState<BacktestRunCard | null>(null);
  const [backtestLoaded, setBacktestLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const online = await fetchHealth();
      if (cancelled) return;

      setStatus(online ? "online" : "offline");

      if (online) {
        const run = await fetchLastBacktestRun();
        if (cancelled) return;
        setLastBacktest(run);
      }

      if (!cancelled) setBacktestLoaded(true);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

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

      <Card className="stagger-item">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-[var(--text-muted)]">Journal backend</span>
          {status === "checking" && <Badge className="text-[var(--text-muted)]">Checking…</Badge>}
          {status === "online" && (
            <Badge className="border-[var(--success)]/40 text-[var(--success)]">Online</Badge>
          )}
          {status === "offline" && (
            <Badge className="border-[var(--error)]/40 text-[var(--error)]">Offline</Badge>
          )}
        </div>
        {status === "offline" && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Start tradingv1:{" "}
            <code className="rounded bg-[var(--bg-muted)] px-1 py-0.5">
              ~/liqui/projects/tradingv1/scripts/dev.sh
            </code>
          </p>
        )}
      </Card>

      <Card className="stagger-item space-y-3">
        <div className="font-semibold text-[var(--text-heading)]">Last backtest</div>
        {status === "online" && backtestLoaded && lastBacktest && (
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-medium text-[var(--text-heading)]">{lastBacktest.strategy}</span>
              <span className="text-[var(--text-muted)]">{lastBacktest.symbol}</span>
            </div>
            <p className="text-[var(--text-muted)]">{formatBacktestSummary(lastBacktest)}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {new Date(lastBacktest.created_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        )}
        {status === "online" && backtestLoaded && !lastBacktest && (
          <p className="text-sm text-[var(--text-muted)]">
            No backtest yet — run batch2_smoke in tradingv1
          </p>
        )}
        {(status === "checking" || (status === "online" && !backtestLoaded)) && (
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
        )}
      </Card>

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

        <Link to="/subjects/algo-lab" className="block">
          <Card className="transition hover:border-[var(--accent-border)]">
            <div className="flex items-start gap-3">
              <FlaskConical size={20} className="text-[#6366f1]" />
              <div className="min-w-0 space-y-1">
                <div className="font-semibold text-[var(--text-heading)]">Algo Lab curriculum</div>
                <p className="text-sm text-[var(--text-muted)]">
                  Data pipelines, backtest hygiene, prop rules as code, and review discipline.
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
                <div className="font-semibold text-[var(--text-heading)]">Open Trading v1</div>
                <p className="text-sm text-[var(--text-muted)]">
                  Journal, equity curve, screenshots, CSV import — localhost:8081.
                </p>
              </div>
              <a
                href={TRADING_JOURNAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button
                  variant="secondary"
                  className="gap-2"
                  disabled={status === "offline"}
                >
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
