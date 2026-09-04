# Performance Audit — Phase 21

**Audit date:** 2026-09-04
**Auditor:** Senior Engineering Team
**Branch:** `feature/performance-audit`
**Working directory:** `C:\Users\musil\Desktop\GLORIOUS GOSPEL CENTRE`
**Stack:** Next.js 14.2.15 → 14.2.35 (patched during this phase), Supabase Postgres + Auth + Storage.

---

## 1. Scope

The audit covered every public-facing page, every admin page, the global layout, the design system, the Tailwind configuration, the Supabase client wrappers, and every Supabase query in `services/`. Specifically:

- All image usage (`<img>`, `<Image>`) across `app/` and `components/`.
- Font loading strategy (or absence of one).
- Server-rendering strategy on every page (`force-dynamic`, ISR, static).
- Data-fetching patterns: parallelisation, deduplication, N+1 detection.
- Bundle composition, code-splitting, and hydration overhead.
- Above-the-fold media on the homepage.
- Storage / image transformation posture.
- Audit-log writes that fire on render.

---

## 2. Findings and Resolutions

### 2.1 Critical

| # | Finding | Severity | Status |
|---|---|---|---|
| C-1 | **Zero `next/image` usage in the codebase.** All 21 image sites used raw `<img>`. No automatic format conversion (AVIF/WebP), no responsive sizing, no CLS protection — every image caused layout shift, no LCP optimisation. | Critical | **Fixed.** Migrated all 21 sites to `next/image`. Added `next.config.mjs` `images.remotePatterns` for `*.supabase.co`, `i.ytimg.com`, `www.youtube.com`, `player.vimeo.com`. Enabled `formats: ['image/avif', 'image/webp']`. |
| C-2 | **No fonts loaded.** `globals.css` referenced `var(--font-sans)` / `var(--font-serif)` which resolved to `Inter` / `Source Serif Pro`, but no `@font-face` and no `next/font` call ever loaded those fonts. Every page rendered in OS fonts; the design intent was silently broken. | Critical | **Fixed.** Configured `next/font/google` for `Inter` and `Source_Serif_4` in `app/layout.tsx`, both with `display: "swap"`, both as CSS variables on `<html>`. Removed the conflicting `:root` block in `globals.css`. |
| C-3 | **Every public page declared `export const dynamic = "force-dynamic"`.** 18 of 18 public pages bypassed static generation and ISR. Every visit hit Supabase. | Critical | **Fixed.** Removed `force-dynamic` from: homepage, `/gallery`, `/gallery/[album]`, `/ministries`, `/ministries/[slug]`, `/events`, `/events/[slug]`, `/sermons/[slug]`, `/sermons/series/[slug]`. Each now has `export const revalidate = 300` (5-minute ISR window) — admin mutations invalidate via `revalidatePath` already in place. |

### 2.2 High

| # | Finding | Severity | Status |
|---|---|---|---|
| H-1 | **Sermon YouTube/Vimeo iframe had no `loading="lazy"`** — every sermon detail page fetched ~1MB of third-party iframe JS at first paint, even when the visitor never scrolled to it. | High | **Fixed.** Added `loading="lazy"` to the sermon iframe (`app/sermons/[slug]/page.tsx:103`). |
| H-2 | **21 `<img>` sites missing `loading="lazy"`** — every below-the-fold image was loaded eagerly. Homepage alone loaded 6 album covers, 1 sermon thumbnail, and up to 3 leader headshots all on first paint. | High | **Fixed.** All migrated images below the fold now use `next/image` with `loading="lazy"`. The latest-sermon thumbnail in `LatestSermonSection.tsx` is the only LCP-critical image and now has `priority`. Hero images on detail pages (`/gallery/[album]`, `/ministries/[slug]`, `/events/[slug]`, `/sermons/[slug]`, `/sermons/series/[slug]`) now have `priority`. |
| H-3 | **Slug-based detail pages fetched the same row twice per request** — once in `generateMetadata`, once in the page body. Affected: `/gallery/[album]`, `/ministries/[slug]`, `/events/[slug]`, `/sermons/[slug]`, `/sermons/series/[slug]`. Doubled Supabase round-trips on every detail-page view. | High | **Fixed.** Wrapped each slug lookup in `react.cache()` so the metadata fetch and the body fetch share one round-trip per render. |
| H-4 | **`prose` class was a no-op** — `@tailwindcss/typography` was not installed, but the codebase used `prose`, `prose-lg`, `prose max-w-none` on sermon, ministry, event, and CMS-page detail views. Pages rendered with broken typography. | High | **Fixed.** Installed `@tailwindcss/typography` as a dev dependency and added it to `tailwind.config.ts` plugins. The typography plugin now applies. |
| H-5 | **Homepage latest-sermon thumbnail was loaded without priority** — the largest contentful paint candidate on the homepage rendered without LCP optimisation. | High | **Fixed.** `LatestSermonSection.tsx` `<Image>` now has `priority`. |

### 2.3 Medium

| # | Finding | Severity | Status |
|---|---|---|---|
| M-1 | **Prayer-requests page fired two audit-log writes per render** — once for the filtered list, once for the unfiltered list used to compute status-chip counts. Doubled audit-log volume. | Medium | **Fixed.** Added `countPrayerRequestsByStatus()` (non-audited aggregate) and changed the page to fetch it in parallel via `Promise.all`. Audit-log writes per render now reduced from 2 to 1. |
| M-2 | **`getSiteSettings()` was fetched 2-3× per request** — once in `generateMetadata`, once in `HeroSection`, often again in the navbar / footer. | Medium | **Fixed.** `getSiteSettings` is now wrapped in `react.cache()` (dedupe within render) **and** `unstable_cache` (5-minute TTL across requests, with `revalidatePath` invalidation on admin save). |
| M-3 | **Unused `prose` Tailwind class referenced 4 detail pages but plugin absent** — pages rendered with broken typography. (See H-4 above.) | Medium | **Fixed.** |

### 2.4 Low / Cleanup

| # | Finding | Severity | Status |
|---|---|---|---|
| L-1 | **`animate-fade-in` keyframe defined but never used.** | Low | **Fixed.** Removed unused keyframe and animation token from `tailwind.config.ts`. |
| L-2 | **In-memory rate limiter acknowledged as multi-instance unsafe.** Already documented in Phase 20. | Low | **Documented** — defer to a future caching phase. |
| L-3 | **`/api/mpesa/callback` raw body is parsed twice** (once for signature, once for content). | Low | **Deferred** — negligible impact. |
| L-4 | **Two `select("*")` calls** in `services/content.ts` (already reduced to one during the site-settings refactor). | Low | **Fixed** for `site_settings`. |
| L-5 | **Detail-page fetches were sequential** in `/gallery/[album]`, `/ministries/[slug]`, `/events/[slug]`, `/sermons/[slug]`, `/sermons/series/[slug]` — `getXBySlug` then `getXChildren`. | Low | **Accepted** — the second query depends on the first row's ID, so Promise.all is not possible. The `react.cache()` dedupe (H-3) is the bigger win. |

### 2.5 Positive Findings (no action required)

- **No N+1 query patterns** anywhere in the codebase.
- **No `dangerouslySetInnerHTML`** anywhere — React's default escaping holds.
- **No client-side `axios`, `moment`, `lodash`, `date-fns`** — minimal client bundle.
- **Pagination** is properly implemented in `/sermons` (`.range`) and `/gallery` (`.range`); page sizes are 20 and 12 respectively.
- **Server actions correctly call `revalidatePath`** for every mutation; ISR `revalidate` values work with this invalidation.
- **Heavy libs (`zod`, `@supabase/supabase-js`)** are confined to server-only modules — they never reach the browser bundle.
- **The `audio` element** uses `preload="metadata"` — only fetches metadata until the user clicks play.
- **Global reduced-motion override** in `globals.css:59-67` correctly disables animations for users who prefer it.

---

## 3. Files Changed

```
app/layout.tsx                                  # next/font/google for Inter + Source Serif_4
app/globals.css                                 # removed conflicting :root font override
app/page.tsx                                    # dropped force-dynamic, added revalidate = 300
app/events/page.tsx                             # dropped force-dynamic, added revalidate = 300; next/image
app/events/[slug]/page.tsx                      # dropped force-dynamic, added revalidate = 300; react.cache for slug lookup; next/image
app/gallery/page.tsx                            # dropped force-dynamic, added revalidate = 300; next/image
app/gallery/[album]/page.tsx                    # dropped force-dynamic, added revalidate = 300; react.cache; next/image
app/gallery/_components/AlbumItemGrid.tsx       # next/image with lazy loading
app/gallery/_components/GalleryLightbox.tsx     # next/image for main + thumbnails (lazy)
app/ministries/page.tsx                         # dropped force-dynamic, added revalidate = 300; next/image
app/ministries/[slug]/page.tsx                  # dropped force-dynamic, added revalidate = 300; react.cache; next/image
app/sermons/[slug]/page.tsx                     # dropped force-dynamic, added revalidate = 300; react.cache; iframe loading=lazy; next/image
app/sermons/series/[slug]/page.tsx              # dropped force-dynamic, added revalidate = 300; react.cache; next/image
app/admin/gallery/[id]/page.tsx                 # next/image for admin previews
app/admin/prayer-requests/page.tsx              # single audit-log write per render
components/about/CmsPageView.tsx                # next/image (page hero, leader grid)
components/home/WelcomeSection.tsx              # next/image (leader headshots)
components/home/LatestSermonSection.tsx         # next/image priority (LCP)
components/home/GallerySection.tsx              # next/image with lazy loading
lib/ip-hash.ts                                  # (unchanged)
next.config.mjs                                 # images.remotePatterns + formats + deviceSizes
package.json / package-lock.json                # next 14.2.15 -> 14.2.35; added @tailwindcss/typography
services/admin/prayer.audited.ts                # added countPrayerRequestsByStatus (non-audited)
services/content.ts                             # getSiteSettings wrapped in react.cache + unstable_cache
tailwind.config.ts                              # @tailwindcss/typography plugin; removed unused animate-fade-in
```

---

## 4. New / Updated Infrastructure

### `next.config.mjs` — image optimisation

```js
images: {
  remotePatterns: [
    { protocol: "https", hostname: "*.supabase.co" },
    { protocol: "https", hostname: "i.ytimg.com" },
    { protocol: "https", hostname: "www.youtube.com" },
    { protocol: "https", hostname: "player.vimeo.com" },
  ],
  formats: ["image/avif", "image/webp"],
  deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920],
  imageSizes: [64, 96, 128, 160, 240, 320, 480],
},
```

### `next/font/google`

```ts
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["400", "600", "700"],
});
```

### ISR strategy

| Route | `revalidate` | Notes |
|---|---|---|
| `/` | 300 s | Homepage. |
| `/events` | 300 s | Listing. |
| `/events/[slug]` | 300 s | Detail. |
| `/gallery` | 300 s | Listing. |
| `/gallery/[album]` | 300 s | Detail. |
| `/ministries` | 300 s | Listing. |
| `/ministries/[slug]` | 300 s | Detail. |
| `/sermons/[slug]` | 300 s | Detail. |
| `/sermons/series/[slug]` | 300 s | Detail. |
| `/sermons`, `/contact`, `/give`, `/prayer`, `/services`, `/about/*` | (force-dynamic for searchParams / per-request data) | Kept dynamic where they read request-time inputs. |
| All `/admin/*` | (force-dynamic) | Read cookies / auth. |

### `getSiteSettings` cache wrapper

`services/content.ts` now wraps the `site_settings` lookup in `react.cache()` and `unstable_cache(...)` with `revalidate: 300` and `tags: ["site_settings"]`. Admin settings saves call `revalidatePath` and now also need to call `revalidateTag("site_settings")` (planned for a follow-up).

---

## 5. Performance Targets (Estimated)

These cannot be measured without a Lighthouse run on production, but the expected impact of each fix:

| Fix | Estimated impact |
|---|---|
| `next/image` with AVIF/WebP | 30-60% reduction in homepage image payload. |
| LCP candidate `priority` on sermon thumbnail | LCP improvement of 0.5-2.0 s. |
| Iframe `loading="lazy"` on sermon detail | -1 MB third-party JS on initial load. |
| ISR on 9 pages | Removes ~9 Supabase queries per request from cache-cold visitors. |
| `getSiteSettings` cache | -2 Supabase queries per public page. |
| `react.cache()` dedupe on detail pages | -1 Supabase query per detail page. |
| `next/font` with `display: swap` | Eliminates font flash; preloads only the weights actually used. |
| Prayer-requests audit-log fix | -50% audit-log write volume on that page. |

---

## 6. Outstanding Items (Not Blockers)

- **Replace `revalidatePath` with `revalidateTag`** for cache-tagged fetchers (e.g., `["site_settings"]`). The current setup works because admin actions already call `revalidatePath` on every relevant route; tag-based invalidation is a refinement.
- **Convert `<img>` to next/image** in any third-party HTML embedded by the CMS (e.g., `CmsPageView.tsx` if the `body` field ever embeds HTML).
- **Add Supabase Image Transformations** (`?width=...&quality=...`) for the largest gallery covers and sermon thumbnails. Currently `next/image` does this on the fly.
- **Measure on Lighthouse** once deployed to staging to confirm the estimated improvements.
- **Code-split heavy admin routes** — none of them exceed ~10 KB currently, but if a future phase adds a heavy editor (e.g., WYSIWYG), consider `next/dynamic`.

None prevent Phase 22 (SEO) from starting.

---

## 7. Phase 21 Acceptance Criteria

| Criterion | Status |
|---|---|
| Audit covers images, fonts, JS, server rendering, DB queries, pagination, caching, lazy loading, media | Done |
| Adopt `next/image` for every `<img>` | Done — 21 sites migrated |
| Configure `next/font` for the design fonts | Done — Inter + Source Serif 4 |
| Configure ISR / cache for static-friendly pages | Done — 9 pages now ISR with `revalidate = 300` |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run build` | Pass — 3 routes are now `○ (Static)` |

---

**End of audit. Phase 21 complete. Ready to begin Phase 22 — SEO.**