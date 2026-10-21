import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

describe("not found behaviour", () => {
  it("has no root loading.tsx that flushes a 200 shell", () => {
    expect(existsSync("app/loading.tsx")).toBe(false);
  });
  it("has no segment loading.tsx under a segment that calls notFound()", () => {
    // A segment-level loading.tsx causes the same 200 flush as the root one.
    for (const seg of ["sermons", "events", "gallery", "ministries", "connect", "testimonies"]) {
      expect(existsSync(`app/${seg}/loading.tsx`), seg).toBe(false);
    }
  });
  it("ministries slug calls notFound()", () => {
    const src = readFileSync("app/ministries/[slug]/page.tsx", "utf8");
    expect(src).toMatch(/if \(!ministry\) notFound\(\)/);
    expect(src).not.toMatch(/if \(!ministry\) return null/);
  });
  it("the 404 page is not indexable", () => {
    const src = readFileSync("app/not-found.tsx", "utf8");
    expect(src).toMatch(/index: false/);
  });
});