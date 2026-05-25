import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { PageContainer } from "./PageContainer";
import { PageHeader } from "./PageHeader";
import { PageLoading } from "./PageLoading";
import { Section } from "./Section";

describe("PageContainer", () => {
  it("renders children with default lg max width", () => {
    const html = renderToStaticMarkup(
      <PageContainer>
        <p>Body</p>
      </PageContainer>,
    );
    expect(html).toContain("max-w-5xl");
    expect(html).toContain("Body");
  });
});

describe("PageHeader", () => {
  it("renders title and optional eyebrow", () => {
    const html = renderToStaticMarkup(
      <PageHeader eyebrow="v2.0.46" title="Today" subtitle="Your track and next steps." />,
    );
    expect(html).toContain("v2.0.46");
    expect(html).toContain("Today");
    expect(html).toContain("Your track and next steps.");
  });

  it("renders back link when backTo is provided", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PageHeader title="Settings" backTo={{ to: "/campus", label: "Campus" }} />
      </MemoryRouter>,
    );
    expect(html).toContain('href="/campus"');
    expect(html).toContain("Campus");
    expect(html).toContain("Settings");
  });
});

describe("PageLoading", () => {
  it("renders skeleton inside PageContainer", () => {
    const html = renderToStaticMarkup(<PageLoading size="narrow" />);
    expect(html).toContain("max-w-3xl");
    expect(html).toContain("animate-pulse");
  });
});

describe("Section", () => {
  it("renders eyebrow and title when provided", () => {
    const html = renderToStaticMarkup(
      <Section eyebrow="Activity" title="This week">
        <p>Content</p>
      </Section>,
    );
    expect(html).toContain("Activity");
    expect(html).toContain("This week");
    expect(html).toContain("Content");
  });
});
