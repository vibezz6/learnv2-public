import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { SessionBar } from "@/features/session/SessionBar";
import { SessionCompleteModal } from "@/features/session/SessionCompleteModal";

// Note: both components gate on the focus-session store, and zustand uses the
// store's INITIAL state for React's SSR snapshot — so renderToStaticMarkup always
// sees the empty state here. These assert the safe empty render (no crash on
// import/mount); the active session bar + completion summary are exercised
// end-to-end in e2e/flows.spec.ts.

describe("SessionBar", () => {
  it("renders nothing (and never throws) with no active session", () => {
    expect(renderToStaticMarkup(<SessionBar />)).toBe("");
  });
});

describe("SessionCompleteModal", () => {
  it("renders nothing (and never throws) with no summary", () => {
    expect(
      renderToStaticMarkup(
        <MemoryRouter>
          <SessionCompleteModal />
        </MemoryRouter>,
      ),
    ).toBe("");
  });
});
