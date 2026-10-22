// tests/unit/page-headings.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("page headings", () => {
  it("PageHeader renders an h1 by default", () => {
    const src = readFileSync("components/ui/PageHeader.tsx", "utf8");
    expect(src).toMatch(/SectionTitle as="h1"/);
  });
  it("CmsPageView renders an h1 in its empty state too", () => {
    // When the CMS row is missing the page would otherwise have no <h1> at all.
    const src = readFileSync("components/about/CmsPageView.tsx", "utf8");
    expect(src).toMatch(/<h1 className="heading-1 mb-4 text-balance">\{fallbackTitle\}<\/h1>/);
  });
  it("does not add hideTitle to the about pages", () => {
    // These render LeaderGrid, which contains no heading — no double-up risk.
    for (const p of ["about", "about/leadership", "about/pastors"]) {
      const src = readFileSync(`app/${p}/page.tsx`, "utf8");
      expect(src, p).not.toMatch(/hideTitle/);
    }
  });
});
