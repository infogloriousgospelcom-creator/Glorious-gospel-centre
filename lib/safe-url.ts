/**
 * Allowlist helpers for CMS image/URL fields and gallery storage paths.
 */

const BLOCKED_PROTOCOLS = new Set(["javascript:", "data:", "vbscript:", "file:", "blob:"]);

export function isSafeHttpsUrl(
  value: string,
  options?: { allowedHosts?: string[] },
): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return false;
  }
  const protocol = url.protocol.toLowerCase();
  if (BLOCKED_PROTOCOLS.has(protocol)) return false;
  if (protocol !== "https:") return false;

  const host = url.hostname.toLowerCase();
  const allowed = options?.allowedHosts;
  if (allowed && allowed.length > 0) {
    return allowed.some(
      (h) => host === h.toLowerCase() || host.endsWith(`.${h.toLowerCase()}`),
    );
  }
  return true;
}

/** HTTPS URLs on the project's Supabase host, or relative same-origin paths starting with /. */
export function isAllowedCmsMediaUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return !trimmed.includes("..") && /^\/[a-zA-Z0-9/_.\- %]+$/.test(trimmed);
  }
  const supabaseHost = (() => {
    try {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
      return base ? new URL(base).hostname.toLowerCase() : null;
    } catch {
      return null;
    }
  })();
  const allowedHosts = [
    ...(supabaseHost ? [supabaseHost] : []),
    "img.youtube.com",
    "i.ytimg.com",
  ];
  return isSafeHttpsUrl(trimmed, { allowedHosts });
}

const STORAGE_PATH_RE = /^[a-zA-Z0-9][a-zA-Z0-9/_.\-]*$/;

export function isSafeStoragePath(path: string): boolean {
  const trimmed = path.trim();
  if (!trimmed || trimmed.length > 500) return false;
  if (trimmed.includes("..") || trimmed.startsWith("/") || trimmed.includes("\\")) {
    return false;
  }
  return STORAGE_PATH_RE.test(trimmed);
}

export function encodeStoragePath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}
