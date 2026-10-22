# Accessibility

This project targets **WCAG 2.1 Level AA**. The notes below summarise
the patterns we follow across the codebase and how to verify them.

## Standards

- [WCAG 2.1 AA](https://www.w3.org/TR/WCAG21/) — the public conformance
  target. We don't claim AAA, but our patterns don't intentionally
  violate AAA either.
- All interactive components must be operable by keyboard alone.
- All meaningful content must have an accessible name and role.
- Visible focus indicators are required for keyboard users.

## Implemented patterns

### Skip link
- A "Skip to main content" link is the first focusable element on every
  page (`app/layout.tsx`).
- It is visually hidden until focused (`sr-only focus:not-sr-only ...`)
  so it does not interfere with the visual design.

### Semantic HTML
- One `<main id="main">` per page.
- Landmarks: `<header>`, `<nav>`, `<main>`, `<footer>` are used
  consistently. Subnavigation uses `aria-label="..."` so screen readers
  can distinguish multiple navs.
- Card links wrap an `<article>`-like block (`<div role="article">`)
  via the `<Card as="article">` prop on `components/ui/Card.tsx`.

### Keyboard
- All focusable controls are native `<button>`, `<a>`, `<input>`,
  `<select>`, `<textarea>` — no `<div onClick>`.
- Modals (`components/ui/Modal.tsx`) trap focus with `Tab` / `Shift+Tab`
  and close on `Escape`.
- Lightbox (`app/gallery/_components/GalleryLightbox.tsx`) traps focus,
  supports `Escape`, `←` / `→` navigation, and `Tab` cycling.
- Mobile navbar (`components/layout/Navbar.tsx`) toggles on `Escape`
  and returns focus to the trigger button when closed.
- Buttons inside forms indicate busy state with `aria-busy` and the
  `isLoading` prop on `<Button>`.

### Focus indicators
- Global rule in `app/globals.css`:
  ```css
  *:focus-visible { outline: 2px solid var(--brand-500); ... }
  a:focus-visible, [role="button"]:focus-visible { ... }
  ```
- Forms use `:focus-visible` ring classes from `tailwind.config.ts`
  shadow / border tokens.

### Forms
- Every input has a visible `<label htmlFor>` (`components/ui/Form.tsx`).
- Hint and error messages are linked via `aria-describedby`.
- Error messages use `role="alert"` so screen readers announce them.
- Invalid fields set `aria-invalid="true"`.
- Honeypot anti-spam fields are wrapped in `aria-hidden="true"` so
  assistive tech doesn't read them.

### Images & alt text
- All `<img>` on public pages have either a meaningful `alt` or an
  empty `alt=""` with the parent marked `aria-hidden="true"`.
- Decorative gradient placeholders are marked `aria-hidden="true"`.
- Gallery thumbnails are buttons with `aria-label` ("Show photo N: alt")
  so the image itself can be `aria-hidden`.

### Color & contrast
- Body text uses `text-ink` on `bg-surface` (≥ 12:1).
- Brand greens and inks were chosen to clear 4.5:1 on white.
- Avoid conveying information by color alone — badges always carry
  text.

### Motion
- Global rule in `app/globals.css` honors `prefers-reduced-motion`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.001ms !important;
      transition-duration: 0.001ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
- `lib/a11y.ts` exposes `respectMotion()` for components that need to
  selectively disable animation.

### Tables / lists
- Tables are not used yet, but when added, must include `<caption>`
  and `<th scope="...">`.

### Live regions
- Search results count uses `aria-live="polite"`.
- Lightbox position uses `aria-live="polite"`.
- Alert component uses `role="status"` for non-error states and
  `role="alert"` for danger / warning states.

## Verification checklist

Manual tests before each release:

- [ ] Tab through the homepage from the URL bar — skip link appears
      first, then header, then content in source order.
- [ ] Open mobile menu with the trigger button — Tab cycles only
      inside the menu; Escape closes and returns focus.
- [ ] Open the gallery lightbox — Tab cycles prev / close / next /
      thumbnails; ← / → navigate; Escape closes.
- [ ] Submit a contact form with bad input — error message is announced.
- [ ] Toggle `prefers-reduced-motion` in DevTools — animations stop.
- [ ] Lighthouse / axe DevTools — no critical or serious violations on
      the public homepage, events, sermons, gallery, contact, give,
      and prayer pages.

## Tools used in CI

- `eslint-plugin-jsx-a11y` (via `next/core-web-vitals`) — flags common
  a11y issues at lint time.
- `npm run lint` must pass before merge.

## Known limitations

- We don't currently run axe-core in CI. This is tracked under Phase
  25 follow-ups.
- Some pages dynamically load charts / video players; ensure those
  ship accessible UI (captions, keyboard controls).
- PDFs / print stylesheets are out of scope until the church produces
  printable bulletins.

## Useful references

- [WCAG Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inclusive Components — Heydon Pickering](https://inclusive-components.design/)
- [The A11Y Project Checklist](https://www.a11yproject.com/checklist/)