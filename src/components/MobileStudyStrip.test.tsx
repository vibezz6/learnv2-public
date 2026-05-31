import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MobileStudyStrip } from "@/components/MobileStudyStrip";

describe("MobileStudyStrip", () => {
  it("renders streak and minimum labels", () => {
    const html = renderToStaticMarkup(<MobileStudyStrip />);
    expect(html).toContain('aria-label="Study status"');
    expect(html).toContain("Min");
  });
});
