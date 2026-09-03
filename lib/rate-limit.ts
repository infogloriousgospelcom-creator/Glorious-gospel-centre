import "server-only";

/**
 * In-memory token bucket rate limiter.
 *
 * IMPORTANT: This works for single-instance deployments only.
 * For multi-instance / serverless production, swap this for a shared
 * store (e.g. Upstash Redis, Vercel KV, Supabase Edge Function KV).
 * The interface (`consume`) is stable so the swap is mechanical.
 */

interface Bucket {
  tokens: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const SWEEP_INTERVAL = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL) return;
  lastSweep = now;
  for (const [k, b] of buckets.entries()) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

export interface RateLimitConfig {
  /** Maximum tokens in the bucket. */
  capacity: number;
  /** Refill interval in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetMs: number;
}

export function consume(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const b: Bucket = { tokens: config.capacity - 1, resetAt: now + config.windowMs };
    buckets.set(key, b);
    return { ok: true, remaining: b.tokens, resetMs: config.windowMs };
  }
  if (existing.tokens <= 0) {
    return { ok: false, remaining: 0, resetMs: Math.max(0, existing.resetAt - now) };
  }
  existing.tokens -= 1;
  return { ok: true, remaining: existing.tokens, resetMs: Math.max(0, existing.resetAt - now) };
}
