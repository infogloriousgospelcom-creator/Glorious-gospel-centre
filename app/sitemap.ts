import "server-only";
import type { MetadataRoute } from "next";
import { createClient } from "@/supabase/server";
import { siteUrl } from "@/lib/seo";

/**
 * Dynamic sitemap covering every public, indexable page on the site.
 *
 * Static routes come from a hard-coded list so they remain stable even
 * when the database is empty. Dynamic routes are fetched at request
 * time so newly published content is indexed without redeploying.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/about/story",
    "/about/vision-mission",
    "/about/statement-of-faith",
    "/about/leadership",
    "/ministries",
    "/services",
    "/events",
    "/sermons",
    "/gallery",
    "/give",
    "/prayer",
    "/contact",
    "/orphans",
    "/feeding",
    "/livestream",
  ].map((p) => ({
    url: siteUrl(p || "/"),
    lastModified: now,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.7,
  }));

  const dynamicEntries: MetadataRoute.Sitemap = [];

  try {
    const supabase = createClient();

    const [events, sermons, ministries, albums, series] = await Promise.all([
      supabase
        .from("events")
        .select("slug, updated_at, published_at")
        .eq("status", "PUBLISHED")
        .then((r) => r.data ?? []),
      supabase
        .from("sermons")
        .select("slug, updated_at, published_at")
        .eq("status", "PUBLISHED")
        .then((r) => r.data ?? []),
      supabase
        .from("ministries")
        .select("slug, updated_at, published_at")
        .eq("status", "PUBLISHED")
        .then((r) => r.data ?? []),
      supabase
        .from("gallery_albums")
        .select("slug, updated_at, published_at")
        .eq("status", "PUBLISHED")
        .then((r) => r.data ?? []),
      supabase
        .from("sermon_series")
        .select("slug, updated_at, published_at")
        .eq("status", "PUBLISHED")
        .then((r) => r.data ?? []),
    ]);

    for (const e of events) {
      if (!e?.slug) continue;
      dynamicEntries.push({
        url: siteUrl(`/events/${e.slug}`),
        lastModified: parseDate(e.updated_at ?? e.published_at) ?? now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const s of sermons) {
      if (!s?.slug) continue;
      dynamicEntries.push({
        url: siteUrl(`/sermons/${s.slug}`),
        lastModified: parseDate(s.updated_at ?? s.published_at) ?? now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    for (const m of ministries) {
      if (!m?.slug) continue;
      dynamicEntries.push({
        url: siteUrl(`/ministries/${m.slug}`),
        lastModified: parseDate(m.updated_at ?? m.published_at) ?? now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    for (const a of albums) {
      if (!a?.slug) continue;
      dynamicEntries.push({
        url: siteUrl(`/gallery/${a.slug}`),
        lastModified: parseDate(a.updated_at ?? a.published_at) ?? now,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }

    for (const sr of series) {
      if (!sr?.slug) continue;
      dynamicEntries.push({
        url: siteUrl(`/sermons/series/${sr.slug}`),
        lastModified: parseDate(sr.updated_at ?? sr.published_at) ?? now,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  } catch {
    // Sitemap should still render with static routes if the DB is down.
  }

  return [...staticEntries, ...dynamicEntries];
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}