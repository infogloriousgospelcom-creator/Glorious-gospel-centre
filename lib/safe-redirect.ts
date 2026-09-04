/**
 * Returns a safe internal redirect target or null when the input is not
 * trustworthy. Guards against:
 *   - Protocol-relative URLs (`//evil.com/admin`) which browsers resolve
 *     to cross-origin locations.
 *   - Backslash-prefixed URLs (`/\\evil.com`) which some browsers
 *     normalize to cross-origin locations.
 *   - URL-encoded protocol-relative paths (`/%5Cevil.com`).
 *   - Any URL containing whitespace, control characters, or schemes.
 */
export function safeAdminRedirect(input: string | undefined | null): string | null {
  if (!input) return null;
  if (input.length > 200) return null;
  if (!input.startsWith("/")) return null;
  if (input.startsWith("//")) return null;
  if (input.startsWith("/\\")) return null;
  if (input.startsWith("/%2F") || input.startsWith("/%5C")) return null;
  if (/[\s\u0000-\u001f\u007f]/.test(input)) return null;
  if (!input.startsWith("/admin")) return null;
  return input;
}