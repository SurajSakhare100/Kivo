import { Request, Response, NextFunction } from "express";
import { AuthService, AuthUser } from "../services/auth.service";
import { getUserTokenProfile } from "../redis/tokenUsage";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      userId: string;
      userPlan: string;
    }
  }
}

/**
 * Optional Authentication Middleware
 * Identifies logged-in Google/JWT users or assigns a persistent guest identity
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization || req.headers["x-auth-token"];
  let token = "";

  if (typeof authHeader === "string") {
    token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();
  }

  if (token) {
    const verified = AuthService.verifyToken(token);
    if (verified) {
      req.user = verified;
      req.userId = verified.id;
      req.userPlan = verified.plan || "free";
      return next();
    }
  }

  // Fallback: Guest or IP-based identity
  const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "127.0.0.1";
  const cleanIp = clientIp.replace(/[^a-zA-Z0-9]/g, "_").slice(-16);
  const guestId = `guest_${cleanIp}`;

  req.userId = guestId;
  req.userPlan = "guest";
  req.user = {
    id: guestId,
    email: "guest@kivo.ai",
    name: "Guest Visitor",
    picture: `https://api.dicebear.com/7.x/identicon/svg?seed=${guestId}`,
    provider: "guest",
    plan: "guest",
  };

  next();
}

/**
 * Enforce logged-in authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.provider === "guest") {
    res.status(401).json({
      error: "Authentication required",
      message: "Please sign in with Google to perform this action.",
    });
    return;
  }
  next();
}
