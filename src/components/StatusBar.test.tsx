import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { StatusBar } from "@/components/StatusBar";

describe("StatusBar", () => {
  it("renders streak, minimum, and SAT-date affordance without throwing", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <StatusBar reviewCount={3} collapsed={false} />
      </MemoryRouter>,
    );
    expect(html).toContain("min"); // "min met" / "min open"
    expect(html).toContain("Set SAT date");
    expect(html).toContain("due"); // reviewCount surfaces "3 due"
  });
});
