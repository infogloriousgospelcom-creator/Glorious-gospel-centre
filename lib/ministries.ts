import type { MinistryItem } from "@/types/content";

/** Slugs that live under dedicated Hospitality routes (not /ministries/[slug]). */
export const HOSPITALITY_PUBLIC_PATHS: Record<string, string> = {
  hospitality: "/ministries/hospitality",
  "orphans-vulnerables": "/ministries/hospitality/orphans",
  "feeding-programme": "/ministries/hospitality/feeding",
};

export type MinistryCategoryId = "families" | "worship" | "mission";

export interface MinistryCategory {
  id: MinistryCategoryId;
  title: string;
  description: string;
  slugs: string[];
}

/**
 * Visual discovery groups — matches published GGCC ministry slugs only.
 * Child Hospitality programmes are linked from the Hospitality page, not listed here.
 */
export const MINISTRY_CATEGORIES: MinistryCategory[] = [
  {
    id: "families",
    title: "Families",
    description: "Ministries that walk with children, youth, women, and men.",
    slugs: ["children", "youth", "women", "men"],
  },
  {
    id: "worship",
    title: "Worship & Church Life",
    description: "Gathering around praise, prayer, and the story of the church.",
    slugs: ["worship", "media", "prayer"],
  },
  {
    id: "mission",
    title: "Mission & Outreach",
    description: "Sharing the Gospel and caring for people beyond our walls.",
    slugs: ["evangelism-outreach", "missions", "hospitality"],
  },
];

const CATEGORY_SLUG_SET = new Set(MINISTRY_CATEGORIES.flatMap((c) => c.slugs));

/** Hide admin placeholders from the public site. */
export function isPublicFacingText(value: string | null | undefined): value is string {
  if (!value) return false;
  const t = value.trim();
  if (!t) return false;
  if (/^PENDING\b/i.test(t)) return false;
  if (/^\[.+\]$/.test(t)) return false;
  return true;
}

export function publicMinistryHref(slug: string): string {
  return HOSPITALITY_PUBLIC_PATHS[slug] ?? `/ministries/${slug}`;
}

/** Top-level ministries for discovery grids (excludes nested Hospitality children). */
export function topLevelMinistries(ministries: MinistryItem[]): MinistryItem[] {
  return ministries.filter((m) => !m.parent_id);
}

export function groupMinistriesForDiscovery(ministries: MinistryItem[]): Array<{
  category: MinistryCategory;
  ministries: MinistryItem[];
}> {
  const top = topLevelMinistries(ministries);
  const bySlug = new Map(top.map((m) => [m.slug, m]));

  const grouped = MINISTRY_CATEGORIES.map((category) => ({
    category,
    ministries: category.slugs
      .map((slug) => bySlug.get(slug))
      .filter((m): m is MinistryItem => Boolean(m)),
  })).filter((g) => g.ministries.length > 0);

  const uncategorized = top.filter((m) => !CATEGORY_SLUG_SET.has(m.slug));
  if (uncategorized.length > 0) {
    grouped.push({
      category: {
        id: "mission",
        title: "More ministries",
        description: "Additional ways to belong and serve at GGCC.",
        slugs: uncategorized.map((m) => m.slug),
      },
      ministries: uncategorized,
    });
  }

  return grouped;
}

export function relatedMinistries(
  current: MinistryItem,
  all: MinistryItem[],
  limit = 3,
): MinistryItem[] {
  const top = topLevelMinistries(all).filter((m) => m.id !== current.id);
  const category = MINISTRY_CATEGORIES.find((c) => c.slugs.includes(current.slug));
  if (category) {
    const peers = category.slugs
      .map((slug) => top.find((m) => m.slug === slug))
      .filter((m): m is MinistryItem => Boolean(m));
    if (peers.length > 0) return peers.slice(0, limit);
  }
  return top.slice(0, limit);
}

export function childMinistries(
  parentId: string,
  all: MinistryItem[],
): MinistryItem[] {
  return all
    .filter((m) => m.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}
