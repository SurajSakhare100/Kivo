import { createApp } from "./app";
import { config } from "./config";
import { initRedis } from "./redis/client";

async function bootstrap() {
  console.log("=========================================");
  console.log("   🚀 Starting Kivo AI Express Server    ");
  console.log("=========================================");

  // Initialize Redis or in-memory fallback
  const { isRealRedis } = initRedis();
  if (isRealRedis) {
    console.log(`[Store] Active distributed Redis: ${config.redisUrl}`);
  } else {
    console.log(`[Store] Active resilient store: In-Memory Redis Engine (Local development ready)`);
  }

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`[Server] Listening on http://localhost:${config.port}`);
    console.log(`[Features] Google Auth, Redis Rate Limiting, Token Pricing, SSE Streaming`);
    console.log(`[Health] http://localhost:${config.port}/health`);
    console.log(`[Pricing] http://localhost:${config.port}/api/tokens/pricing`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("\n[Server] Shutting down gracefully...");
    server.close(() => {
      console.log("[Server] Closed HTTP listener.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
