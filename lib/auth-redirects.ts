/**
 * Safe internal redirect helpers for member auth flows.
 * Rejects open redirects (external URLs, protocol-relative, etc.).
 */

const MEMBER_DEFAULT = "/account";

const MEMBER_EXACT = new Set([
  "/",
  "/account",
  "/connect",
  "/give",
  "/visit",
  "/prayer",
  "/testimonies",
  "/reset-password",
  "/login",
  "/register",
  "/forgot-password",
]);

const MEMBER_PREFIXES = [
  "/account?",
  "/connect/",
  "/give?",
  "/testimonies/",
  "/reset-password?",
  "/login?",
  "/visit?",
  "/prayer?",
];

export function isSafeInternalPath(path: string): boolean {
  if (!path || typeof path !== "string") return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("\\")) return false;
  if (path.includes("@")) return false;
  if (path.includes("://")) return false;
  if (/[\x00-\x1f]/.test(path)) return false;
  return true;
}

function isMemberAllowedPath(path: string): boolean {
  if (MEMBER_EXACT.has(path)) return true;
  const bare = path.split("?")[0] ?? path;
  if (MEMBER_EXACT.has(bare)) return true;
  return MEMBER_PREFIXES.some((prefix) => path.startsWith(prefix) || bare.startsWith(prefix.replace(/\?$/, "/")));
}

/**
 * Validate a post-auth redirect for congregant flows.
 * Never returns `/admin/*`.
 */
export function safeMemberRedirect(redirectTo: string | null | undefined): string | null {
  if (!redirectTo) return null;
  const trimmed = redirectTo.trim();
  if (!isSafeInternalPath(trimmed)) return null;
  const bare = trimmed.split("?")[0] ?? trimmed;
  if (bare === "/admin" || bare.startsWith("/admin/")) return null;
  if (!isMemberAllowedPath(trimmed)) return null;
  return trimmed;
}

/** Admin post-login destinations only. */
export function safeAdminRedirect(redirectTo: string | null | undefined): string | null {
  if (!redirectTo) return null;
  const trimmed = redirectTo.trim();
  if (!isSafeInternalPath(trimmed)) return null;
  const bare = trimmed.split("?")[0] ?? trimmed;
  if (bare === "/admin" || bare.startsWith("/admin/")) return trimmed;
  return null;
}

/** Resolve `next` query for /auth/callback (default /account). */
export function resolveMemberNext(next: string | null | undefined): string {
  return safeMemberRedirect(next) ?? MEMBER_DEFAULT;
}

/** Legacy allowlist used by admin login for non-admin sessions (/give). */
export function safeLegacyMemberRedirect(redirectTo: string | null | undefined): string | null {
  if (!redirectTo || !isSafeInternalPath(redirectTo)) return null;
  if (redirectTo === "/give" || redirectTo.startsWith("/give?")) return redirectTo;
  return null;
}

export const MEMBER_AUTH_DEFAULT_REDIRECT = MEMBER_DEFAULT;
