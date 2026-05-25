import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Button, Card, PageContainer, PageHeader } from "@/components/ui";
import { cn } from "@/lib/cn";

export function ExpectedValueCalculator() {
  const [scenarios, setScenarios] = useState([
    { probability: "40", outcome: "300" },
    { probability: "60", outcome: "-150" },
  ]);

  const updateScenario = (i: number, field: "probability" | "outcome", val: string) => {
    const next = [...scenarios];
    next[i][field] = val;
    setScenarios(next);
  };

  const addScenario = () => setScenarios([...scenarios, { probability: "", outcome: "" }]);
  const removeScenario = (i: number) => setScenarios(scenarios.filter((_, idx) => idx !== i));

  let totalProb = 0;
  let ev = 0;
  scenarios.forEach((s) => {
    const p = parseFloat(s.probability) || 0;
    const o = parseFloat(s.outcome) || 0;
    totalProb += p;
    ev += (p / 100) * o;
  });

  const isValid = Math.abs(totalProb - 100) < 0.01;

  const resultTone = !isValid ? "warning" : ev >= 0 ? "success" : "danger";
  const resultStyles = {
    warning: {
      panel: "border-[var(--warning)] bg-[var(--warning-bg)]",
      text: "text-[var(--warning)]",
    },
    success: {
      panel: "border-[var(--success)] bg-[var(--success-bg)]",
      text: "text-[var(--success)]",
    },
    danger: {
      panel: "border-[var(--danger)] bg-[var(--danger-bg)]",
      text: "text-[var(--danger)]",
    },
  }[resultTone];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 size={18} className="text-[var(--accent)]" />
        <span className="font-semibold text-[var(--accent)]">Expected Value Calculator</span>
      </div>

      <div className="flex flex-col gap-3">
        {scenarios.map((s, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Probability (%)</label>
              <input
                type="number"
                value={s.probability}
                aria-label="Probability percentage"
                onChange={(e) => updateScenario(i, "probability", e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-border)]"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Outcome ($)</label>
              <input
                type="number"
                value={s.outcome}
                aria-label="Outcome in dollars"
                onChange={(e) => updateScenario(i, "outcome", e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2 py-1.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-border)]"
              />
            </div>
            {scenarios.length > 1 && (
              <Button
                variant="secondary"
                aria-label={`Remove scenario ${i + 1}`}
                className="px-2.5 py-1.5"
                onClick={() => removeScenario(i)}
              >
                ×
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button variant="secondary" className="text-[13px]" onClick={addScenario}>
        + Add Scenario
      </Button>

      <div
        className={cn(
          "rounded-[var(--radius-sm)] border px-3.5 py-3",
          resultStyles.panel,
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <span className={cn("font-semibold", resultStyles.text)}>
            Expected Value: {isValid ? `$${ev.toFixed(2)}` : "—"}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            Total probability: {totalProb.toFixed(1)}%{!isValid && " (must = 100%)"}
          </span>
        </div>
        {isValid && (
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            {ev > 0
              ? "Positive EV — this is a profitable bet over time."
              : ev < 0
                ? "Negative EV — you will lose money on average."
                : "Break-even — no edge, no loss."}
          </p>
        )}
      </div>
    </div>
  );
}

export function ExpectedValueToolPage() {
  return (
    <PageContainer size="sm" className="space-y-6">
      <PageHeader
        backTo={{ to: "/tools", label: "Calculators" }}
        eyebrow="Probability"
        title="Expected value"
        subtitle="Weight outcomes by probability to see whether a bet is +EV over time."
      />
      <Card className="stagger-item border-[var(--accent-border)] bg-[var(--accent-bg)]">
        <ExpectedValueCalculator />
      </Card>
    </PageContainer>
  );
}
