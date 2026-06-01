import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RemindersSettingsCard } from "@/features/settings/RemindersSettingsCard";

describe("RemindersSettingsCard", () => {
  it("renders the reminders + accountability controls without throwing", () => {
    const html = renderToStaticMarkup(<RemindersSettingsCard onMessage={() => {}} />);
    expect(html).toContain("Desktop reminders");
    expect(html).toContain("Accountability");
    // Gentle/Standard/Strict choices are present
    expect(html).toContain("Standard");
  });
});
