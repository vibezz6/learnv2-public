import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Modal } from "@/components/ui/Modal";

// Focus-trap / Escape behavior is covered by the Playwright keyboard e2e (needs a
// real DOM). Here we just verify SSR render output in the node test environment.
describe("Modal", () => {
  it("renders children inside a dialog when open", () => {
    const html = renderToStaticMarkup(
      <Modal open onClose={() => {}} ariaLabel="Test dialog">
        <p>Hello modal</p>
      </Modal>,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("Hello modal");
  });

  it("renders nothing when closed", () => {
    const html = renderToStaticMarkup(
      <Modal open={false} onClose={() => {}} ariaLabel="Test dialog">
        <p>Hidden</p>
      </Modal>,
    );
    expect(html).toBe("");
  });
});
