import { describe, expect, it } from "vitest";
import {
  LEARN_DEV_ORIGIN,
  LEARN_TRADING_LAB_URL,
  TRADING_API_ORIGIN,
  TRADING_JOURNAL_ORIGIN,
} from "./devPorts";

describe("devPorts", () => {
  it("uses standard local ports for Learn, API, and journal UI", () => {
    expect(LEARN_DEV_ORIGIN).toBe("http://127.0.0.1:8080");
    expect(TRADING_API_ORIGIN).toBe("http://127.0.0.1:8000");
    expect(TRADING_JOURNAL_ORIGIN).toBe("http://127.0.0.1:8081");
    expect(LEARN_TRADING_LAB_URL).toBe("http://127.0.0.1:8080/lab/trading");
  });
});
