import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  /**
   * Google OAuth verification & sign in
   */
  static async googleLogin(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const credential =
        typeof req.body?.credential === "string" ? req.body.credential.trim() : "";

      if (!credential) {
        res.status(400).json({ error: "Missing Google credential" });
        return;
      }

      const session = await AuthService.verifyGoogleCredential(credential);
      res.json(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Auth] Google Login error:", msg);
      res.status(401).json({
        error: "Google authentication failed",
        message: msg,
      });
    }
  }

  /**
   * Instant demo sign in
   */
  static async demoLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, name } = req.body || {};
      const session = await AuthService.demoLogin(email, name);
      res.json(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Auth] Demo Login error:", msg);
      res.status(400).json({
        error: "Demo login failed",
        message: msg,
      });
    }
  }

  /**
   * Get current session profile and live token quota
   */
  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      const profile = await AuthService.getProfile(userId, req.user);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Log out
   */
  static async logout(_req: Request, res: Response): Promise<void> {
    res.json({ success: true, message: "Logged out successfully" });
  }
}
