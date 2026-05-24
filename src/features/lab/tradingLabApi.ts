export const TRADING_API_BASE = "http://127.0.0.1:8000";
export const TRADING_JOURNAL_URL = "http://127.0.0.1:8081";

export type BacktestRunCard = {
  strategy: string;
  symbol: string;
  created_at: string;
  metrics: Record<string, unknown>;
};

function isBacktestRunCard(value: unknown): value is BacktestRunCard {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.strategy === "string" &&
    typeof obj.symbol === "string" &&
    typeof obj.created_at === "string" &&
    typeof obj.metrics === "object" &&
    obj.metrics !== null &&
    !Array.isArray(obj.metrics)
  );
}

function formatMetric(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return null;
}

export async function fetchHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${TRADING_API_BASE}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchLastBacktestRun(): Promise<BacktestRunCard | null> {
  try {
    const res = await fetch(`${TRADING_API_BASE}/api/backtest/last-run`);
    if (!res.ok) return null;

    const data = (await res.json()) as { run?: unknown };
    const run = data.run;
    if (run == null) return null;
    return isBacktestRunCard(run) ? run : null;
  } catch {
    return null;
  }
}

export function formatBacktestSummary(card: BacktestRunCard): string {
  const parts: string[] = [`${card.symbol} · ${card.strategy}`];

  const returnPct = formatMetric(card.metrics.total_return_pct);
  if (returnPct !== null) {
    parts.push(`${returnPct}% return`);
  }

  const drawdownPct = formatMetric(card.metrics.max_drawdown_pct);
  if (drawdownPct !== null) {
    parts.push(`${drawdownPct}% max DD`);
  }

  const tradeCount = formatMetric(card.metrics.trade_count);
  if (tradeCount !== null) {
    parts.push(`${tradeCount} trades`);
  }

  return parts.join(", ");
}
