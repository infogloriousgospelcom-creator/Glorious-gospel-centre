import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const DEFAULT_OG_IMAGE = "/og-default.svg";

/**
 * Returns the absolute URL for the given path. Path should start with
 * `/`. The `metadataBase` in app/layout.tsx handles the same job for
 * Next.js image / link generation; this helper is for cases where a
 * plain string URL is needed (canonical, sitemap, JSON-LD).
 */
export function siteUrl(path = ""): string {
  const base = SITE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Returns the absolute URL for an OG image. Accepts either an already
 * absolute URL (returned unchanged) or a relative path under the site.
 * Falls back to the default OG image shipped in `/public`.
 */
export function ogImageUrl(imagePath: string | null | undefined): string {
  const src = imagePath ?? DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(src)) return src;
  return siteUrl(src.startsWith("/") ? src : `/${src}`);
}

/**
 * Build an absolute URL with `metadataBase` semantics for Next.js
 * `openGraph.images[].url` and `twitter.images`. Pass through anything
 * already absolute; otherwise treat as site-relative.
 */
function absoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return siteUrl(value.startsWith("/") ? value : `/${value}`);
}

/**
 * Page-level metadata builder. Every public page routes through this
 * to get a consistent canonical URL + OG/Twitter coverage.
 */
export interface PageSeoInput {
  /** Page title (without the church-name suffix). */
  title: string;
  /** Page description. */
  description: string;
  /** Absolute or site-relative path. Used for canonical + OG URL. */
  path: string;
  /** Optional OG image override (absolute URL or site-relative path). */
  image?: string | null;
  /** OG image alt text. */
  imageAlt?: string;
  /** Override the `type` for OG (default "website"). */
  type?: "website" | "article" | "video.other" | "music.song" | "profile";
  /** Override the published/modified time for `article` OG. */
  publishedTime?: string;
  modifiedTime?: string;
  /** Page keywords (optional). */
  keywords?: string[];
  /** Custom canonical URL (defaults to `path`). */
  canonical?: string;
  /** Set `index: false` for non-indexable pages. */
  noindex?: boolean;
}

export function buildPageMetadata(input: PageSeoInput): Metadata {
  const canonicalPath = input.canonical ?? input.path;
  const imageUrl = ogImageUrl(input.image ?? DEFAULT_OG_IMAGE);
  const canonical = absoluteUrl(canonicalPath);
  const ogType = input.type ?? "website";

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical },
    openGraph: {
      type: ogType,
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: "Glorious Gospel Centre",
      locale: "en_KE",
      images: [
        {
          url: imageUrl,
          alt: input.imageAlt ?? input.title,
          ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
          ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [imageUrl],
    },
    robots: input.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}

/**
 * Default church metadata used by the root layout.
 */
export const DEFAULT_SEO = {
  churchName: "Glorious Gospel Centre",
  defaultTitle: "Glorious Gospel Centre Church — worship, community, teaching, and outreach.",
  defaultDescription:
    "Glorious Gospel Centre Church in Kenya — worship, community, teaching, and outreach. Join us for Sunday services, mid-week fellowship, and outreach.",
  defaultOgImage: DEFAULT_OG_IMAGE,
  siteUrl: SITE_URL,
};

/* ------------------------------------------------------------------ */
/* Structured data (JSON-LD)                                          */
/* ------------------------------------------------------------------ */

/** Base shape of a JSON-LD node. Always includes @context. */
export interface JsonLd {
  "@context": "https://schema.org";
  "@type": string;
  [key: string]: unknown;
}

/**
 * Build a `Church` + `LocalBusiness` schema for the church itself.
 * Used in the root layout and the home page.
 */
export interface ChurchSchemaInput {
  name: string;
  description: string;
  url: string;
  logoUrl?: string | null;
  imageUrl?: string | null;
  telephone?: string | null;
  email?: string | null;
  address?: string | null;
  /** IANA timezone, e.g. "Africa/Nairobi". */
  timezone?: string;
}

export function buildChurchSchema(input: ChurchSchemaInput): JsonLd {
  const node: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Church",
    name: input.name,
    description: input.description,
    url: input.url,
    ...(input.logoUrl ? { logo: input.logoUrl } : {}),
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: input.address,
            addressCountry: "KE",
          },
        }
      : {}),
    ...(input.timezone ? { openingHoursSpecification: input.timezone } : {}),
  };
  return node;
}

/**
 * Build an `Event` schema for an event detail page.
 */
export interface EventSchemaInput {
  name: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  url: string;
  imageUrl?: string | null;
  location?: string | null;
  performer?: string | null;
  organizerName: string;
  organizerUrl: string;
  status?: "EventScheduled" | "EventCancelled" | "EventMovedOnline";
}

export function buildEventSchema(input: EventSchemaInput): JsonLd {
  const node: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    description: input.description,
    startDate: input.startDate,
    ...(input.endDate ? { endDate: input.endDate } : {}),
    eventStatus: `https://schema.org/${input.status ?? "EventScheduled"}`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: input.url,
    organizer: {
      "@type": "Organization",
      name: input.organizerName,
      url: input.organizerUrl,
    },
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
    ...(input.location
      ? {
          location: {
            "@type": "Place",
            name: input.location,
          },
        }
      : {}),
    ...(input.performer
      ? {
          performer: {
            "@type": "Person",
            name: input.performer,
          },
        }
      : {}),
  };
  return node;
}

/**
 * Build a `VideoObject` schema for a sermon. We mark sermons that are
 * videos as `VideoObject` so they appear in video search results.
 */
export interface VideoSchemaInput {
  name: string;
  description: string;
  thumbnailUrl?: string | null;
  uploadDate: string;
  contentUrl?: string | null;
  embedUrl?: string | null;
  durationSeconds?: number | null;
}

export function buildVideoSchema(input: VideoSchemaInput): JsonLd {
  const node: JsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: input.name,
    description: input.description,
    uploadDate: input.uploadDate,
    ...(input.thumbnailUrl ? { thumbnailUrl: input.thumbnailUrl } : {}),
    ...(input.contentUrl ? { contentUrl: input.contentUrl } : {}),
    ...(input.embedUrl ? { embedUrl: input.embedUrl } : {}),
    ...(input.durationSeconds
      ? { duration: iso8601Duration(input.durationSeconds) }
      : {}),
  };
  return node;
}

/**
 * Build a `BreadcrumbList` schema for any page with hierarchical nav.
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/**
 * Convert seconds to ISO 8601 duration (e.g. PT1H30M5S).
 */
export function iso8601Duration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "PT0S";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  let out = "PT";
  if (h > 0) out += `${h}H`;
  if (m > 0) out += `${m}M`;
  if (s > 0 || (h === 0 && m === 0)) out += `${s}S`;
  return out;
}

/**
 * Truncate a string for OG descriptions (Google ~200 chars).
 */
export function truncate(text: string, max = 200): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Strip HTML / newlines for description fallbacks.
 */
export function plainText(input: string | null | undefined, max = 200): string {
  if (!input) return "";
  return truncate(input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "), max);
}