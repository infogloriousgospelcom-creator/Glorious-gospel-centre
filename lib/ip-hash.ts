import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

function readClientIp(): string | null {
  try {
    const h = headers();
    const fwd = h.get("x-forwarded-for");
    return (fwd ? fwd.split(",")[0]?.trim() : null) ?? h.get("x-real-ip") ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns the hashed form of the client IP. Hashed so that we never
 * store raw IP addresses alongside audit metadata; this is the value
 * used for rate-limit keys, audit logs, and abuse signals.
 */
export function getClientIpHash(): string | null {
  const ip = readClientIp();
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 64);
}

/**
 * Returns the raw client IP. Use only when the raw value is required
 * (e.g. for short-lived rate-limit bucket keys in process memory).
 * Never log this value or include it in audit metadata.
 */
export function getClientIp(): string | null {
  return readClientIp();
}