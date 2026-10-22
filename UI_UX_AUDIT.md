# UI / UX Audit — Glorious Gospel Centre Church

**Scope:** Read-only inspection of the current codebase. No files modified.
**Goal:** Identify exactly which files / components / styles are candidates for visual changes, so that when approved changes are supplied, the implementation is precise and minimal.

---

## 1. Design foundation (what already exists)

### 1.1 Design tokens — `tailwind.config.ts`

- **Color palette** — deep olive/forest green (`brand-*`, primary brand) and warm gold/honey (`accent-*`).
  - `brand.50–950`: olive greens. 700 (#425031) and 800 (#374129) are the primary action colors. 900 (#2f3825) is the deep brand backdrop used for dark sections.
  - `accent.50–900`: gold/honey. 600 (#a06827) and 700 (#7d4f23) are used for secondary CTAs and pull-quotes.
  - `ink`: neutral text. DEFAULT (#1a1f15), `muted` (#56663c), `subtle` (#8c9a6b).
  - `surface`: DEFAULT white, `muted` (#f6f7f3 page tint), `inset` (#f1f2ec sunken surface).
  - Status colors: `success`, `warning`, `danger`, `info` — each 50 / 600 / 700.
- **Fonts** — Inter (sans) + Source Serif 4 (serif). Loaded via `next/font/google` in `app/layout.tsx` and exposed as CSS variables `--font-sans` / `--font-serif`.
- **Type scale** — three clamp-based display sizes (`display-1`, `display-2`, `display-3`) with negative letter-spacing. Used via `.heading-1` / `.heading-2` / `.heading-3` utility classes in `app/globals.css`.
- **Spacing** — `section` (4rem) and `section-lg` (6rem) used in the `<Section>` component.
- **Radii** — `sm 0.375`, `DEFAULT 0.5`, `lg 0.75`, `xl 0.875`, `2xl 1.125`, `3xl 1.5`. The codebase heavily uses `rounded-2xl` (1.125rem) for cards.
- **Shadows** — `soft`, `elevated`, `ring` (focus halo).
- **Motion** — `ease-smooth` cubic-bezier(0.22, 1, 0.36, 1). Two keyframes: `fade-in`, `scale-in`. Used in Modal and as available utilities.
- **Container** — `container-page` utility (`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`) defined in `app/globals.css` and used via the `<Container>` UI component.

### 1.2 Global CSS — `app/globals.css`

- Tailwind base/components/utilities layers.
- Body defaults (`bg-surface text-ink antialiased`).
- Universal `:focus-visible` ring (brand-500) on every focusable element.
- Three typography utilities: `.heading-1`, `.heading-2`, `.heading-3`.
- `.lead` — text-lg leading-relaxed text-ink-muted paragraph style.
- `.skip-link` — accessibility skip link.
- `prefers-reduced-motion` handler globally disables animations.

### 1.3 Reusable UI primitives — `components/ui/`

| Component | File | Responsibility | Variants |
|---|---|---|---|
| `Button` | `Button.tsx` | Buttons with brand-coherent colors | primary, secondary, ghost, danger, link × sm/md/lg + `isLoading` |
| `Card` | `Card.tsx` | Content surface | Header, Body, Footer, Title, Description sub-components |
| `Section` + `Container` | `Container.tsx` | Vertical rhythm + max-width layout | Section takes optional `as` |
| `SectionEyebrow` / `SectionLead` / `SectionTitle` / `EmptyState` / `ErrorState` | `Section.tsx` | Section header pattern | All accept `className` |
| `Badge` | `Badge.tsx` | Small status pill | neutral, brand, accent, success, warning, danger, info |
| `Alert` | `Alert.tsx` | Inline message | success, warning, danger, info |
| `Field` / `Input` / `Textarea` | `Form.tsx` | Form atoms with label + hint + error | Input + Textarea shared base styles |
| `Modal` | `Modal.tsx` | Client-side dialog with focus trap | sm, md, lg |
| `Skeleton` | `Skeleton.tsx` | Loading shimmer | `className` |
| `TopBar` | `layout/TopBar.tsx` | Slim top strip on every page | static |
| `Navbar` | `layout/Navbar.tsx` | Primary navigation + mobile menu | client component |
| `Footer` | `layout/Footer.tsx` | Footer link grid | static |
| `AdminSubnav` | `layout/AdminSubnav.tsx` | Sticky admin section nav | client, active state via `usePathname()` |
| `AboutSubnav` | `layout/AboutSubnav.tsx` | Section nav for /about/* | accepts `active` prop |
| `JsonLd` | `seo/JsonLd.tsx` | Schema.org JSON-LD | |

### 1.4 Layout pattern

Most public pages follow the same structure:

```
<>
  <Navbar />
  <main id="main">
    <Section className="bg-gradient-to-br from-brand-50 via-surface to-accent-50">  ← page hero
      <Container>...</Container>
    </Section>
    <Section>                                                                   ← content
      <Container>...</Container>
    </Section>
    <Section className="bg-surface-muted">                                      ← secondary
      <Container>...</Container>
    </Section>
  </main>
  <Footer />
</>
```

The admin layout (`app/admin/(protected)/layout.tsx`) wraps `<Navbar/>` + an admin header (role badge + email + Dashboard/Account links + sign-out) + `<AdminSubnav/>` + `<main>` + `<Footer/>`.

---

## 2. Pages audited

### 2.1 Public pages

| Route | File | Visual signature |
|---|---|---|
| `/` | `app/page.tsx` | 9 stacked home sections (hero, welcome, this-week, ministries, latest-sermon dark band, prayer CTA, gallery, outreach, giving dark CTA) |
| `/about` | `app/about/page.tsx` | Brand-to-accent gradient hero + AboutSubnav + 4 card grid + featured leaders section |
| `/about/story` | `app/about/story/page.tsx` | AboutSubnav + CmsPageView CMS-rendered article |
| `/about/vision-mission` | `app/about/vision-mission/page.tsx` | AboutSubnav + CmsPageView |
| `/about/statement-of-faith` | `app/about/statement-of-faith/page.tsx` | AboutSubnav + CmsPageView |
| `/about/leadership` | `app/about/leadership/page.tsx` | AboutSubnav + LeaderGrid |
| `/ministries` | `app/ministries/page.tsx` | Hero + 3-col ministry card grid |
| `/ministries/[slug]` | `app/ministries/[slug]/page.tsx` | Hero + optional hero image + 2-col body + meetings/contact sidebar + ministry-leaders grid |
| `/services` | `app/services/page.tsx` | Hero + grouped-by-day cards (note: `Day {day+1}` label bug observed) |
| `/events` | `app/events/page.tsx` | Hero + Upcoming card grid + Past list |
| `/events/[slug]` | `app/events/[slug]/page.tsx` | Hero + poster + body + registration form |
| `/sermons` | `app/sermons/page.tsx` | Hero + filters + sermon grid + series list + pagination |
| `/sermons/[slug]` | `app/sermons/[slug]/page.tsx` | Hero + embed/audio + scripture + description |
| `/sermons/series/[slug]` | `app/sermons/series/[slug]/page.tsx` | Series detail |
| `/gallery` | `app/gallery/page.tsx` | Hero + filters + album grid + pagination |
| `/gallery/[album]` | `app/gallery/[album]/page.tsx` | Album detail + grid + lightbox |
| `/give` | `app/give/page.tsx` | Hero + 2-col form + aside cards |
| `/prayer` | `app/prayer/page.tsx` | Hero + 2-col form + aside cards + dark quote |
| `/contact` | `app/contact/page.tsx` | Hero + 2-col form + 3 aside cards + optional map |
| `/orphans`, `/feeding` | (no public page files) | Linked from `OutreachSection` and `Footer`; landing page returns 404 |
| `/privacy` | (no public page file) | Linked from footer; landing page returns 404 |
| `/livestream` | (no public page file) | Linked from footer + OutreachSection; returns 404 |
| `/leadership` | (no public page file) | Linked from footer; returns 404 (the actual leadership page lives at `/about/leadership`) |
| `/design-system` | `app/design-system/page.tsx` | Internal-only showcase, not indexed |
| `/robots.txt`, `/sitemap.xml` | `app/robots.ts`, `app/sitemap.ts` | SEO surface |
| `not-found.tsx`, `error.tsx`, `loading.tsx` | top-level error states | |

### 2.2 Admin pages (under `app/admin/(protected)/`)

`dashboard`, `account`, `announcements` (+ `new`, `[id]`), `events` (+ `new`, `[id]`), `sermons` (+ `new`, `[id]`), `series` (+ `new`, `[id]`), `ministries` (+ `new`, `[id]`), `leadership` (+ `new`, `[id]`), `services` (+ `new`, `[id]`), `pages` (+ `new`, `[id]`), `gallery` (+ `new`, `[id]`), `prayer-requests`, `messages`, `giving` (+ `[id]`), `approvals`, `audit`, `users`, `settings`.

Common pattern: hero card with title + description, plus either a list card or a form card. Forms are client components (`useFormState` + `useFormStatus`) with consistent `Field`/`Input`/`Textarea`/`Button`/`Alert` usage.

### 2.3 Admin public-facing routes

`/admin/login`, `/admin/forgot-password`, `/admin/reset-password` — each renders a centered card on `bg-surface-muted`, inside the public `<Navbar/>` + `<Footer/>`.

---

## 3. Findings — candidates for visual change

Each finding states **what currently exists**, **which files are affected**, and **why it is a candidate** (not an instruction to change). The exact change must come from the approved list in the master prompt.

### 3.1 Content / data gaps currently rendered as placeholder text

These are not "styling" issues per se — they are textual placeholders that the supplied church data (already in the database after the previous task) can replace. Listed here so any approved visual change that depends on real content knows where the data exists.

| File | Line | Current text | Status |
|---|---|---|---|
| `components/layout/TopBar.tsx` | 13 | `"[Phone TBD]"` (literal placeholder in the public top strip on every page) | `site_settings.phone` already populated — replace with `{settings.phone}` |
| `app/admin/(protected)/dashboard/page.tsx` | 146–148 | "Some quick actions land on pages that are placeholders today" | Doc note; no visual change needed |
| `app/contact/page.tsx` | 22, 92, 100 | `[To be provided]` and `[Paybill TBD]`, `[Bank details TBD]` | Backed by `site_settings` columns; switch to live values |
| `app/give/page.tsx` | 92, 101 | `[Paybill TBD — admin settings]`, `[Bank details TBD — admin settings]` | Backed by `site_settings` |
| `app/gallery/page.tsx`, `app/events/page.tsx`, etc. | many | EmptyState placeholders ("Gallery coming soon", etc.) | Visible when no content exists; harmless when content exists |

### 3.2 Inconsistent page-header pattern

- Some public pages use `<PageHero eyebrow title description>` (defined in `components/about/CmsPageView.tsx:49`).
- Some public pages use a hand-rolled `<Section className="bg-gradient-to-br from-brand-50 via-surface to-accent-50">` with `<SectionEyebrow>`, `<SectionTitle>`, `<SectionLead>` inside.
- Some admin pages use `<h1 className="heading-1">` without any eyebrow or lead.
- Result: visual inconsistency between page heroes.

**Candidate files:**
- `components/about/CmsPageView.tsx` (PageHero)
- `components/ui/Section.tsx` (SectionEyebrow/SectionTitle/SectionLead)
- All `app/*/page.tsx` files that hand-roll hero markup: `app/about/page.tsx`, `app/ministries/page.tsx`, `app/ministries/[slug]/page.tsx`, `app/services/page.tsx`, `app/events/page.tsx`, `app/sermons/page.tsx`, `app/gallery/page.tsx`, `app/give/page.tsx`, `app/prayer/page.tsx`, `app/contact/page.tsx`.

### 3.3 Inconsistent button heights & corner radii in hero CTAs

Hero CTAs across pages use three different sizes inline:
- `h-12 px-6 text-base` (home, `HeroSection.tsx:29, 35`)
- `h-11 px-5 text-sm` (about, ministries, events, prayer, etc.)
- inline `px-5 py-3 text-sm` (not-found, error pages)

The codebase already has a `<Button size="lg|md|sm">` component that maps to exactly these dimensions. Candidates: every inline button class on the home and public pages, plus the `not-found`/`error` fallback buttons.

**Candidate files:** `components/home/HeroSection.tsx`, `components/home/WelcomeSection.tsx`, `components/home/MinistriesSection.tsx`, `components/home/PrayerCtaSection.tsx`, `components/home/GivingCtaSection.tsx`, `components/home/LatestSermonSection.tsx`, `app/not-found.tsx`, `app/error.tsx`, `app/about/page.tsx`, plus most public `app/*/page.tsx` files.

### 3.4 Services page has a "Day {day+1}" label bug

`app/services/page.tsx:64` shows `Day {day + 1}` literally (e.g., "Day 2") on every day-of-week header instead of the actual day name. The day label (`label`) is computed in `groupServicesByDay` in `services/content.ts` but the page uses `day + 1` rather than `label`.

**File:** `app/services/page.tsx` (one line).

### 3.5 TopBar / Footer inconsistencies with current church data

- `components/layout/TopBar.tsx` shows the literal `"[Phone TBD]"` and never reads from `site_settings`.
- `components/layout/Footer.tsx` hardcodes "Glorious Gospel Centre" as the footer brand name. Now that the church name is updated in the DB ("Glorious Gospel Centre Church"), this should read from `site_settings`.
- `components/layout/Footer.tsx` hardcodes the same links as the Navbar with slight differences. Phone, email, address are not in the footer. They are in `site_settings`.
- The `Footer.tsx` "Connect" group links `/leadership` (a 404 — actual page is `/about/leadership`). Same for "Engage" linking `/livestream` (404) and "Support" linking `/orphans`, `/feeding` (404 pages), plus `/privacy` (404).

**Candidate files:**
- `components/layout/TopBar.tsx`
- `components/layout/Footer.tsx`
- `app/layout.tsx` (which already calls `getSiteSettings()` and could pass it down)

### 3.6 Navbar active state

`components/layout/Navbar.tsx` has 9 primary links but no visual indication of the current section (no `usePathname`, no `aria-current`). All other nav surfaces (`AboutSubnav`, `AdminSubnav`) highlight the current page.

**File:** `components/layout/Navbar.tsx`.

### 3.7 `services/[id]/page.tsx` (admin) — pattern used vs admin pages

The admin services pages use the same `h-1` + button-as-link pattern as the other admin list pages. No anomalies; they inherit the existing admin design system. Listed only as a baseline reference.

### 3.8 The AdminSubnav sticky offset assumes a single 64px Navbar

`components/layout/AdminSubnav.tsx:33` uses `top-16 z-30` (sticky 64px from top). The Navbar is indeed `h-16` and `sticky top-0`, so this works. However, when the AdminSubnav is the second sticky band (after the Navbar), there is no visual separation — the AdminSubnav `bg-surface/95` blends with the Navbar `bg-surface/90`. There is also the admin header above it (`bg-surface` with `border-b`). Currently the order in `app/admin/(protected)/layout.tsx:22–53` is Navbar → admin header → AdminSubnav. The AdminSubnav is not visually distinct enough from the admin header (same surface bg, similar height, similar tone).

**Candidate files:** `components/layout/AdminSubnav.tsx`, `app/admin/(protected)/layout.tsx`.

### 3.9 `<img>` elements instead of `next/image`

A pre-existing lint warning fires on every `<img>` element (the project uses raw HTML `<img>` throughout). Affects 16+ files. Already documented in `PROJECT_AUDIT.md`.

### 3.10 Mobile menu — primary nav

`components/layout/Navbar.tsx` mobile menu (`md:hidden` toggle). On public pages with hero CTAs above the fold, the hamburger is at the same `h-16` row as the brand. Functionally complete; candidate for visual polish only.

### 3.11 `Section` `as` default is "section", but inner divs use `<section>` repeatedly

`components/ui/Container.tsx:14` — `<Section as: Tag = "section">`. The Section component supports `as: section | div | article` but most callers never pass it. Hero CTAs and content sections all render `<section>` semantically. Functional; no change candidate.

### 3.12 Form submission feedback in admin

All admin form pages use the `<Button isLoading={pending}>` + `<Alert tone="danger">` pattern. The success state never re-renders visibly (because the action returns and redirects). One-off,; no change candidate.

### 3.13 `void Badge;` in `app/admin/(protected)/approvals/page.tsx:34`

A stray `void Badge;` line after the default export. It has no runtime effect (Badge is referenced nowhere in the file) but is dead code. Listed as a minor cleanup candidate.

### 3.14 Lightbox and gallery components

`app/gallery/_components/GalleryLightbox.tsx`, `AlbumItemGrid.tsx`, `GalleryFilters.tsx`, `GalleryPagination.tsx`. Functional, accessible. Candidate files for any visual polish request.

### 3.15 The "Verify links" badge in Contact

`app/contact/page.tsx:144` renders a hardcoded `<Badge tone="brand">Verified links</Badge>` next to social links regardless of whether they have actually been verified. Candidate for a smaller textual refinement.

### 3.16 The 5th hero CTA "Why we give" and the giving CTA box

`components/home/GivingCtaSection.tsx:29` shows a "Why we give" button that links to `/about` (not a giving explanation page). Candidate for either a content change or removal.

### 3.17 Hero image placeholder

`components/home/HeroSection.tsx:53` renders an empty `aspect-[4/5]` gradient rectangle on every home page load (the church has no hero image on file). Functionally a placeholder. Candidate for visual treatment (illustration, photo, or labeled overlay).

### 3.18 Admin dashboard quick-actions list

`app/admin/(protected)/dashboard/page.tsx:130–148` — the "Quick actions" list shows all five actions unconditionally. A user might prefer filter-by-role visibility, but that's a UX/scope question, not a visual one.

### 3.19 Form select element style mismatch

`AnnouncementForm.tsx:104`, `EventForm.tsx:169`, `LeaderForm.tsx`, `MinistryForm.tsx`, `ServiceForm.tsx`, `SeriesForm.tsx`, `SermonForm.tsx`, `PageForm.tsx` all hand-roll a `<select>` with class:
```
"h-11 rounded-xl border border-brand-200 bg-white px-3.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
```
This duplicates the `<Input>` class string. A `Select` UI primitive would unify this. Candidate for a small UI primitive addition.

### 3.20 Admin pages lack page-headers consistent with public pages

Admin pages use `<h1 className="heading-1">` + `<p className="text-sm text-ink-muted">` (no eyebrow, no gradient hero). Some pages also use `<SectionEyebrow>` + `<SectionTitle>` (`announcements/page.tsx`). The mix is inconsistent. Candidate for unification.

### 3.21 Orphaned admin breadcrumb pattern

`app/admin/(protected)/announcements/[id]/page.tsx:50–54` shows a back-link "← All announcements". Same pattern in `[id]` pages of events, sermons, ministries, leadership, services, pages, gallery. Functional but inconsistent (some have it, others don't). Candidate for a small back-link helper.

### 3.22 No "page not found" hero on admin

Admin route 404 currently falls back to the root `not-found.tsx`, which has the public look. Not a regression but a candidate for an admin-specific 404.

---

## 4. Inventory of files relevant to visual / UX changes

Grouped by the kind of change likely to be requested.

### 4.1 Files driving public layout / chrome

- `app/layout.tsx` — root layout, fonts, TopBar
- `app/globals.css` — global styles
- `tailwind.config.ts` — design tokens
- `components/layout/TopBar.tsx`
- `components/layout/Navbar.tsx`
- `components/layout/Footer.tsx`
- `components/layout/AboutSubnav.tsx`
- `components/layout/AdminSubnav.tsx`
- `components/ui/Button.tsx`, `Card.tsx`, `Container.tsx`, `Section.tsx`, `Badge.tsx`, `Alert.tsx`, `Form.tsx`, `Modal.tsx`, `Skeleton.tsx`

### 4.2 Files driving public page heroes

- `components/about/CmsPageView.tsx` — PageHero
- `components/home/HeroSection.tsx`, `WelcomeSection.tsx`, `ThisWeekSection.tsx`, `MinistriesSection.tsx`, `LatestSermonSection.tsx`, `PrayerCtaSection.tsx`, `GallerySection.tsx`, `OutreachSection.tsx`, `GivingCtaSection.tsx`
- All `app/*/page.tsx` that hand-roll hero markup

### 4.3 Files driving admin pages

- `app/admin/layout.tsx` — public wrapper
- `app/admin/(protected)/layout.tsx` — protected wrapper
- `app/admin/(protected)/**/page.tsx` — admin pages
- `app/admin/(protected)/**/_components/*.tsx` — admin form / row / toggle components

### 4.4 Files driving specific page templates

- `app/events/page.tsx`, `app/events/[slug]/page.tsx`
- `app/sermons/page.tsx`, `app/sermons/[slug]/page.tsx`, `app/sermons/series/[slug]/page.tsx`
- `app/gallery/page.tsx`, `app/gallery/[album]/page.tsx`
- `app/gallery/_components/*.tsx`
- `app/ministries/page.tsx`, `app/ministries/[slug]/page.tsx`
- `app/services/page.tsx`
- `app/give/page.tsx`, `app/give/_components/GivingForm.tsx`
- `app/prayer/page.tsx`, `app/prayer/_components/PrayerRequestForm.tsx`
- `app/contact/page.tsx`, `app/contact/_components/ContactForm.tsx`
- `app/loading.tsx`, `app/not-found.tsx`, `app/error.tsx`

### 4.5 Files driving design-system showcase

- `app/design-system/page.tsx`
- `app/design-system/_components/ModalPreview.tsx`

---

## 5. Boundaries — what this audit did NOT inspect

- **Database content** — only structural fields; no data review.
- **Server-side logic** — `services/`, `lib/`, `supabase/` were not deeply audited for visual concerns.
- **Tests** — `tests/` was not reviewed.
- **Accessibility specifics** — `ACCESSIBILITY.md` and `lib/a11y.ts` exist; not reviewed line by line.
- **Build & deploy** — `vercel.json`, `next.config.mjs`, CI workflow.
- **SEO schema** — `lib/seo.ts`, `components/seo/`.

---

## 6. Status

Audit complete. **No code modified.**

Awaiting the approved visual changes from the master prompt before any implementation.