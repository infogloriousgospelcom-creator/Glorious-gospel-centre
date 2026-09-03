import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

export function getClientIpHash(): string | null {
  try {
    const h = headers();
    const fwd = h.get("x-forwarded-for");
    const ip = (fwd ? fwd.split(",")[0]?.trim() : null) ?? h.get("x-real-ip") ?? null;
    if (!ip) return null;
    return createHash("sha256").update(ip).digest("hex").slice(0, 64);
  } catch {
    return null;
  }
}
