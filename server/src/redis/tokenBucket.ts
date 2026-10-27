import { getRedisClient } from "./client";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  totalRequests: number;
}

/**
 * Sliding Window / Fixed Window Counter Rate Limiter backed by Redis
 * @param identifier User ID, IP, or session token
 * @param limit Maximum allowed requests per window
 * @param windowSeconds Window length in seconds (default: 60)
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds = 60
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const currentWindow = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `ratelimit:${identifier}:${currentWindow}`;

  // Increment counter atomically
  const totalRequests = await redis.incr(key);

  if (totalRequests === 1) {
    // Set expiry on first request in window
    await redis.expire(key, windowSeconds + 2);
  }

  const ttl = await redis.ttl(key);
  const resetSeconds = ttl > 0 ? ttl : windowSeconds;
  const remaining = Math.max(0, limit - totalRequests);
  const allowed = totalRequests <= limit;

  return {
    allowed,
    limit,
    remaining,
    resetSeconds,
    totalRequests,
  };
}
