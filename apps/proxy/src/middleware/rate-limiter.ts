import { createMiddleware } from 'hono/factory';
import type { AppVariables } from '../types.js';

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TOKENS = 60;
const REFILL_RATE = 1;
const REFILL_INTERVAL_MS = 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const STALE_THRESHOLD_MS = 10 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > STALE_THRESHOLD_MS) buckets.delete(key);
  }
}, CLEANUP_INTERVAL_MS);

function getBucket(key: string): Bucket {
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: Date.now() };
    buckets.set(key, bucket);
  }

  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  const refill = Math.floor(elapsed / REFILL_INTERVAL_MS) * REFILL_RATE;
  if (refill > 0) {
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  return bucket;
}

export const rateLimiter = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const workspace = c.get('workspace');
  const key = workspace?.id || c.req.header('x-forwarded-for') || 'anonymous';
  const bucket = getBucket(key);

  if (bucket.tokens <= 0) {
    c.header('Retry-After', '1');
    return c.json({ error: 'Too many requests' }, 429);
  }

  bucket.tokens -= 1;
  c.header('X-RateLimit-Remaining', String(bucket.tokens));
  await next();
});
