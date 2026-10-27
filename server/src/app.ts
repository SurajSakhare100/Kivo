import express, { Express, Request, Response } from "express";
import cors from "cors";
import { config } from "./config";
import { authenticate } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import tokensRoutes from "./routes/tokens.routes";
import chatRoutes from "./routes/chat.routes";
import healthRoutes from "./routes/health.routes";

export function createApp(): Express {
  const app = express();

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin) return callback(null, true);
        if (
          config.corsOrigins.includes(origin) ||
          origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:")
        ) {
          return callback(null, true);
        }
        callback(null, true); // Dev permissive
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Auth-Token",
        "X-Requested-With",
      ],
      exposedHeaders: [
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
        "X-Tokens-Remaining",
        "X-Tokens-Limit",
        "X-Tokens-Plan",
      ],
    })
  );

  // Body Parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Basic request logger in dev
  app.use((req, _res, next) => {
    if (config.nodeEnv !== "test") {
      const start = Date.now();
      _res.on("finish", () => {
        console.log(`[HTTP] ${req.method} ${req.originalUrl} ${_res.statusCode} (${Date.now() - start}ms)`);
      });
    }
    next();
  });

  // Global user authentication (attaches req.user & req.userId)
  app.use(authenticate);

  // Mount API Sub-routers
  app.use("/api/auth", authRoutes);
  app.use("/api/tokens", tokensRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/health", healthRoutes);

  // Root welcome
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      name: "Kivo AI Builder Server",
      status: "operational",
      version: "1.0.0",
      docs: {
        auth: "/api/auth",
        tokens: "/api/tokens",
        chat: "/api/chat",
        health: "/health",
      },
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: "Not Found",
      message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`,
    });
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
