import { Router, Request, Response } from "express";
import { getRedisHealthStatus } from "../redis/client";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const redis = getRedisHealthStatus();
  res.json({
    status: "ok",
    service: "kivo-ai-backend",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    redis: {
      status: redis.status,
      isRealRedis: redis.isRealRedis,
      targetUrl: redis.targetUrl,
    },
    features: [
      "google_oauth",
      "jwt_session",
      "redis_rate_limiting",
      "token_based_pricing",
      "dummy_token_limit_settings",
      "sse_streaming",
    ],
  });
});

export default router;
