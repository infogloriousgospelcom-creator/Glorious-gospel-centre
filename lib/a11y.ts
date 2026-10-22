/**
 * Accessibility helpers shared across client components.
 */

/**
 * Returns keyboard handlers for an Escape key listener. Useful for
 * dismissing overlays (modals, lightboxes, drawers) on `Esc`.
 */
export function onEscape(handler: () => void) {
  return (e: React.KeyboardEvent | KeyboardEvent) => {
    if ("key" in e && e.key === "Escape") handler();
  };
}

/**
 * Returns true if the event originated from a keyboard interaction
 * (vs a mouse / touch). Used to gate visual focus indicators that
 * would otherwise flash on every click.
 */
export function isKeyboardEvent(
  e: React.MouseEvent | React.KeyboardEvent,
): boolean {
  if ("detail" in e) {
    // MouseEvent.detail: 0 = keyboard-originated click in some browsers,
    // >0 = click count. We treat detail === 0 as ambiguous, default to
    // keyboard when the synthetic event was produced by Enter / Space.
    return e.detail === 0;
  }
  return true;
}

/**
 * ARIA props for a region that announces loading state to screen
 * readers. Combine with `aria-busy` on the container.
 */
export const ariaLivePolite = { "aria-live": "polite" as const };
export const ariaLiveAssertive = { "aria-live": "assertive" as const };

/**
 * Visually hidden text used for screen-reader-only labels. The CSS
 * utility `.sr-only` (Tailwind) handles the visual hiding.
 */
export type SrOnlyProps = { children: React.ReactNode };

/**
 * Build a screen-reader-only description for an interactive element.
 * Returned string is meant to be rendered inside a `.sr-only` span.
 */
export function sr(label: string): string {
  return label;
}

/**
 * Visible focus ring class. Apply to interactive elements that
 * should always show a focus ring (not gated by :focus-visible).
 */
export const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";

/**
 * Reduce-motion guard. Returns the supplied value when the user
 * has NOT requested reduced motion, otherwise returns `null` or a
 * reduced alternative. Use to disable transitions / autoplay.
 */
export function respectMotion<T>(value: T, reduced: T | null = null): T | null {
  if (typeof window === "undefined") return value;
  const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  if (mq?.matches) return reduced;
  return value;
}