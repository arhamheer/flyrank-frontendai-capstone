/**
 * In-memory, per-instance sliding-window rate limiter.
 *
 * Deliberately not distributed: it resets on redeploy and does not share
 * state across serverless instances. That's an acceptable tradeoff for a
 * capstone-scale app (see README limitations) — the goal is to stop a single
 * client from hammering the Groq free tier, not to enforce a hard global
 * quota. For multi-instance production use, swap this for Upstash Redis or
 * Vercel KV with the same interface.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, now: number = Date.now()): RateLimitResult {
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetAt: now + WINDOW_MS,
    };
  }

  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.windowStart + WINDOW_MS,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - existing.count,
    resetAt: existing.windowStart + WINDOW_MS,
  };
}

/** Test-only: clear all buckets between test cases. */
export function resetRateLimitState(): void {
  buckets.clear();
}
