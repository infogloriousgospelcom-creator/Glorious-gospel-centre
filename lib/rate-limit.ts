import "server-only";

/**
 * Rate limiter with optional Supabase-backed persistence.
 *
 * When SUPABASE_SERVICE_ROLE_KEY is available and migration 0025 is applied,
 * uses `consume_rate_limit` RPC (works across serverless instances).
 * Falls back to in-memory buckets for local/dev without service role.
 */

import { createServiceRoleClient, isServiceRoleConfigured } from "@/supabase/admin";

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
  capacity: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetMs: number;
}

function consumeMemory(key: string, config: RateLimitConfig): RateLimitResult {
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

export async function consumeAsync(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  if (isServiceRoleConfigured()) {
    try {
      const supabase = createServiceRoleClient();
      const { data, error } = await supabase.rpc("consume_rate_limit", {
        p_key: key,
        p_capacity: config.capacity,
        p_window_ms: config.windowMs,
      });
      if (!error && Array.isArray(data) && data[0]) {
        const row = data[0] as { ok: boolean; remaining: number; reset_ms: number };
        return {
          ok: Boolean(row.ok),
          remaining: Number(row.remaining ?? 0),
          resetMs: Number(row.reset_ms ?? config.windowMs),
        };
      }
      // RPC missing (migration not applied) → fall through to memory.
    } catch {
      // fall through
    }
  }
  return consumeMemory(key, config);
}

/** Sync in-memory limiter (tests + fallback). Prefer `consumeAsync` in server actions. */
export function consume(key: string, config: RateLimitConfig): RateLimitResult {
  return consumeMemory(key, config);
}
