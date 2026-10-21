import { describe, expect, it } from "vitest";
import {
  buildPageMetadata,
  siteUrl,
  ogImageUrl,
  buildChurchSchema,
  buildEventSchema,
  buildVideoSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  iso8601Duration,
  truncate,
  plainText,
  resolveSiteUrl,
} from "@/lib/seo";
import { existsSync, statSync } from "node:fs";

describe("seo helpers", () => {
  describe("siteUrl", () => {
    it("joins path to base, collapsing trailing slash", () => {
      expect(siteUrl("/about")).toBe("http://localhost:3000/about");
    });
    it("treats empty path as root", () => {
      expect(siteUrl("")).toBe("http://localhost:3000/");
    });
    it("prepends slash when missing", () => {
      expect(siteUrl("events")).toBe("http://localhost:3000/events");
    });
  });

  describe("ogImageUrl", () => {
    it("returns absolute URLs as-is", () => {
      expect(ogImageUrl("https://cdn.example.com/x.png")).toBe(
        "https://cdn.example.com/x.png",
      );
    });
    it("falls back to default for null / undefined", () => {
      expect(ogImageUrl(null)).toBe("http://localhost:3000/og-default.png");
      expect(ogImageUrl(undefined)).toBe("http://localhost:3000/og-default.png");
    });
    it("resolves relative paths under the site", () => {
      expect(ogImageUrl("/poster.png")).toBe("http://localhost:3000/poster.png");
    });
  });

  describe("buildPageMetadata", () => {
    it("returns canonical, OG, Twitter, and robots", () => {
      const m = buildPageMetadata({
        title: "About",
        description: "About us",
        path: "/about",
      });
      expect(m.title).toBe("About");
      expect(m.description).toBe("About us");
      expect(m.alternates?.canonical).toBe("http://localhost:3000/about");
      expect(m.openGraph?.url).toBe("http://localhost:3000/about");
      expect(m.openGraph?.title).toBe("About");
      const twitter = m.twitter as { card?: string } | undefined;
      expect(twitter?.card).toBe("summary_large_image");
      expect(m.robots).toEqual({
        index: true,
        follow: true,
        googleBot: { index: true, follow: true },
      });
    });

    it("honors noindex", () => {
      const m = buildPageMetadata({
        title: "Admin",
        description: "x",
        path: "/admin",
        noindex: true,
      });
      expect(m.robots).toEqual({ index: false, follow: false });
    });
  });

  describe("structured data", () => {
    it("builds a Church schema", () => {
      const node = buildChurchSchema({
        name: "Glorious Gospel Centre Church",
        description: "Worship",
        url: "https://ggc.example",
      });
      expect(node["@context"]).toBe("https://schema.org");
      expect(node["@type"]).toBe("Church");
      expect(node.name).toBe("Glorious Gospel Centre Church");
    });

    it("builds an Event schema with organizer", () => {
      const node = buildEventSchema({
        name: "Concert",
        description: "Annual concert",
        startDate: "2026-01-01T18:00:00Z",
        url: "https://ggc.example/events/concert",
        organizerName: "GGC",
        organizerUrl: "https://ggc.example",
      });
      expect(node["@type"]).toBe("Event");
      expect(node.startDate).toBe("2026-01-01T18:00:00Z");
      expect(node.eventStatus).toBe("https://schema.org/EventScheduled");
    });

    it("builds a VideoObject schema with ISO duration", () => {
      const node = buildVideoSchema({
        name: "Sermon",
        description: "Grace",
        uploadDate: "2026-01-01",
        durationSeconds: 3665,
      });
      expect(node["@type"]).toBe("VideoObject");
      expect(node.duration).toBe("PT1H1M5S");
    });

    it("builds a BreadcrumbList", () => {
      const node = buildBreadcrumbSchema([
        { name: "Home", url: "https://ggc.example/" },
        { name: "Events", url: "https://ggc.example/events" },
      ]);
      expect(node["@type"]).toBe("BreadcrumbList");
      const items = node.itemListElement as Array<Record<string, unknown>>;
      expect(items).toHaveLength(2);
      expect(items[0].position).toBe(1);
    });
  });

  describe("iso8601Duration", () => {
    it.each([
      [0, "PT0S"],
      [30, "PT30S"],
      [90, "PT1M30S"],
      [3600, "PT1H"],
      [3665, "PT1H1M5S"],
    ])("formats %i seconds as %s", (secs, expected) => {
      expect(iso8601Duration(secs)).toBe(expected);
    });
  });

  describe("text helpers", () => {
    it("truncates long strings with ellipsis", () => {
      const s = "a".repeat(250);
      const out = truncate(s, 100);
      expect(out.length).toBeLessThanOrEqual(100);
      expect(out.endsWith("…")).toBe(true);
    });

    it("strips HTML for plainText", () => {
      const out = plainText("<p>Hello <b>world</b></p>", 200);
      expect(out).toBe("Hello world");
    });
  });
});

describe("site url and absolute titles", () => {
  it("throws in production when the site url is missing", () => {
    const prevUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const prevVercel = process.env.VERCEL_URL;
    const prevNode = process.env.NODE_ENV;
    delete (process.env as Record<string, string | undefined>).NEXT_PUBLIC_SITE_URL;
    delete (process.env as Record<string, string | undefined>).VERCEL_URL;
    // @ts-expect-error - NODE_ENV is readonly in types but writable at runtime
    process.env.NODE_ENV = "production";
    try {
      expect(() => resolveSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/);
    } finally {
      if (prevUrl !== undefined) process.env.NEXT_PUBLIC_SITE_URL = prevUrl;
      else delete (process.env as Record<string, string | undefined>).NEXT_PUBLIC_SITE_URL;
      if (prevVercel !== undefined) process.env.VERCEL_URL = prevVercel;
      else delete (process.env as Record<string, string | undefined>).VERCEL_URL;
      // @ts-expect-error - NODE_ENV is readonly in types but writable at runtime
      process.env.NODE_ENV = prevNode ?? "test";
    }
  });
  it("uses the configured site url", () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    try {
      process.env.NEXT_PUBLIC_SITE_URL = "https://example.org/";
      expect(resolveSiteUrl()).toBe("https://example.org");
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = prev;
    }
  });


  it("falls back to the vercel url", () => {
    const prevUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const prevVercel = process.env.VERCEL_URL;
    try {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      process.env.VERCEL_URL = "my-project.vercel.app";
      expect(resolveSiteUrl()).toBe("https://my-project.vercel.app");
    } finally {
      if (prevUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = prevUrl;
      if (prevVercel === undefined) delete process.env.VERCEL_URL;
      else process.env.VERCEL_URL = prevVercel;
    }
  });

  it("produces an absolute title when asked", () => {
    const m = buildPageMetadata({
      title: "Glorious Gospel Centre Church",
      description: "Test description",
      absoluteTitle: true,
      path: "/",
    });
    expect(m.title).toEqual({ absolute: "Glorious Gospel Centre Church" });
  });

  it("points the default og image at a file that exists", () => {
    expect(existsSync("public/og-default.png")).toBe(true);
    const size = statSync("public/og-default.png").size;
    expect(size).toBeGreaterThan(0);
    expect(size).toBeLessThan(300 * 1024);
  });
});

describe("local seo schema", () => {
  it("emits sameAs and opening hours for the church", () => {
    const s = buildChurchSchema({
      name: "GGCC",
      description: "d",
      url: "https://example.org",
      sameAs: ["https://facebook.com/ggcc"],
      openingHours: [{ day: "Sunday", opens: "08:00" }],
    });
    expect(s.sameAs).toEqual(["https://facebook.com/ggcc"]);
    expect((s.openingHoursSpecification as unknown[])[0]).toMatchObject({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
    });
  });
  it("emits a valid FAQPage", () => {
    const s = buildFaqSchema([{ question: "q", answer: "a" }]);
    expect(s["@type"]).toBe("FAQPage");
    expect((s.mainEntity as unknown[])[0]).toMatchObject({ "@type": "Question" });
  });
});
