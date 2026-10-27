import { Request, Response, NextFunction } from "express";
import { checkRateLimit } from "../redis/tokenBucket";
import { PRICING_PLANS } from "../config";
import { getUserTokenProfile } from "../redis/tokenUsage";

export interface RateLimitOptions {
  customLimit?: number;
  windowSeconds?: number;
  message?: string;
}

/**
 * Express middleware for Redis rate limiting based on User Tier
 */
export function rateLimiter(options: RateLimitOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId || "anonymous";
      
      // Determine allowed requests per minute based on plan
      let limit = options.customLimit;
      if (!limit) {
        const profile = await getUserTokenProfile(userId, req.userPlan || "free");
        limit = profile.planDetails?.rateLimitPerMin || PRICING_PLANS.free.rateLimitPerMin;
      }

      const windowSeconds = options.windowSeconds || 60;
      const result = await checkRateLimit(userId, limit, windowSeconds);

      // Set standard rate limit headers
      res.setHeader("X-RateLimit-Limit", result.limit);
      res.setHeader("X-RateLimit-Remaining", result.remaining);
      res.setHeader("X-RateLimit-Reset", result.resetSeconds);

      if (!result.allowed) {
        res.setHeader("Retry-After", result.resetSeconds);
        res.status(429).json({
          error: "Rate limit exceeded",
          message: options.message || `You have exceeded your plan's rate limit of ${result.limit} requests per minute.`,
          retryAfter: result.resetSeconds,
          limit: result.limit,
          plan: req.userPlan || "free",
        });
        return;
      }

      next();
    } catch (err) {
      console.error("[RateLimiter Error]", err);
      // Fail open so users aren't locked out on redis error
      next();
    }
  };
}
