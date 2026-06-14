import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TRADING_API_BASE,
  type BacktestRunCard,
  fetchEnrichmentQueueCount,
  fetchLastBacktestRun,
  formatBacktestSummary,
} from "@/features/lab/tradingLabApi";

const mockRun: BacktestRunCard = {
  strategy: "RSI Strategy",
  symbol: "BTC-USD",
  created_at: "2026-05-24T12:00:00Z",
  metrics: {
    total_return_pct: 12.3,
    max_drawdown_pct: 5.4,
    trade_count: 47,
  },
};

describe("formatBacktestSummary", () => {
  it("formats symbol, strategy, and present metrics", () => {
    expect(formatBacktestSummary(mockRun)).toBe(
      "BTC-USD · RSI Strategy, 12.3% return, 5.4% max DD, 47 trades",
    );
  });

  it("omits metrics that are missing or invalid", () => {
    const card: BacktestRunCard = {
      strategy: "Momentum",
      symbol: "ETH-USD",
      created_at: "2026-05-24T12:00:00Z",
      metrics: { total_return_pct: 8.1 },
    };

    expect(formatBacktestSummary(card)).toBe("ETH-USD · Momentum, 8.1% return");
  });
});

describe("fetchEnrichmentQueueCount", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns array length when fetch succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: 1 }, { id: 2 }],
      }),
    );

    await expect(fetchEnrichmentQueueCount()).resolves.toBe(2);
    expect(fetch).toHaveBeenCalledWith(`${TRADING_API_BASE}/api/trades/enrichment-queue`);
  });

  it("returns null when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => [],
      }),
    );

    await expect(fetchEnrichmentQueueCount()).resolves.toBeNull();
  });

  it("returns null when body is not an array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ trades: [] }),
      }),
    );

    await expect(fetchEnrichmentQueueCount()).resolves.toBeNull();
  });
});

describe("fetchLastBacktestRun", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed run when fetch succeeds with valid shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ run: mockRun }),
      }),
    );

    await expect(fetchLastBacktestRun()).resolves.toEqual(mockRun);
    expect(fetch).toHaveBeenCalledWith(`${TRADING_API_BASE}/api/backtest/last-run`);
  });

  it("returns null when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ run: mockRun }),
      }),
    );

    await expect(fetchLastBacktestRun()).resolves.toBeNull();
  });

  it("returns null when run fails validation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ run: { strategy: "RSI Strategy", symbol: "BTC-USD" } }),
      }),
    );

    await expect(fetchLastBacktestRun()).resolves.toBeNull();
  });
});
