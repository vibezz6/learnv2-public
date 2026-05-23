import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { Badge, Card } from "@/components/ui";

export function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState("10000");
  const [monthlyContribution, setMonthlyContribution] = useState("500");
  const [annualRate, setAnnualRate] = useState("7");
  const [years, setYears] = useState("30");

  const P = parseFloat(principal) || 0;
  const PMT = parseFloat(monthlyContribution) || 0;
  const r = (parseFloat(annualRate) || 0) / 100;
  const t = parseFloat(years) || 0;
  const n = 12;

  const futureValue =
    P * Math.pow(1 + r / n, n * t) + PMT * ((Math.pow(1 + r / n, n * t) - 1) / (r / n));
  const totalContributed = P + PMT * 12 * t;
  const interestEarned = futureValue - totalContributed;

  const dataPoints = [];
  for (let y = 0; y <= t; y += Math.max(1, Math.floor(t / 10))) {
    const fv =
      P * Math.pow(1 + r / n, n * y) + PMT * ((Math.pow(1 + r / n, n * y) - 1) / (r / n));
    dataPoints.push({ year: y, value: fv });
  }

  const maxVal = Math.max(...dataPoints.map((d) => d.value), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={18} className="text-[var(--success)]" />
        <span className="font-semibold text-[var(--success)]">Compound Interest Calculator</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Initial Investment ($)</label>
          <input
            type="number"
            value={principal}
            aria-label="Initial Investment in dollars"
            onChange={(e) => setPrincipal(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-border)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Monthly Contribution ($)</label>
          <input
            type="number"
            value={monthlyContribution}
            aria-label="Monthly Contribution in dollars"
            onChange={(e) => setMonthlyContribution(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-border)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Annual Return (%)</label>
          <input
            type="number"
            value={annualRate}
            aria-label="Annual Return percentage"
            onChange={(e) => setAnnualRate(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-border)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[var(--text-muted)]">Years</label>
          <input
            type="number"
            value={years}
            aria-label="Investment period in years"
            onChange={(e) => setYears(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-input)] px-2.5 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-border)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[var(--radius-sm)] border border-[var(--success)]/40 bg-[var(--success-bg)] px-3 py-2.5">
          <div className="text-xs text-[var(--text-muted)]">Future Value</div>
          <div className="text-base font-bold text-[var(--success)]">
            ${futureValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--info)]/40 bg-[var(--info-bg)] px-3 py-2.5">
          <div className="text-xs text-[var(--text-muted)]">Total Contributed</div>
          <div className="text-base font-bold text-[var(--info)]">
            ${totalContributed.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[var(--accent-border)] bg-[var(--accent-bg)] px-3 py-2.5">
          <div className="text-xs text-[var(--text-muted)]">Interest Earned</div>
          <div className="text-base font-bold text-[var(--accent)]">
            ${interestEarned.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <div className="mb-2 flex h-20 items-end gap-1">
        {dataPoints.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full min-h-1 rounded-t-sm"
              style={{
                height: `${(d.value / maxVal) * 80}px`,
                background:
                  i === dataPoints.length - 1 ? "var(--success)" : "color-mix(in srgb, var(--success) 60%, transparent)",
              }}
            />
            <span className="text-xs text-[var(--text-muted)]">{d.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompoundInterestToolPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 md:p-8">
      <section className="stagger-item space-y-2">
        <Badge>Tools · Finance</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
          Compound interest
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Project growth from an initial investment, monthly contributions, and annual return.
        </p>
      </section>
      <Card className="stagger-item border-[var(--success)]/40 bg-[var(--success-bg)]">
        <CompoundInterestCalculator />
      </Card>
    </div>
  );
}
