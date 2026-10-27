import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  /**
   * Google OAuth verification & sign in
   */
  static async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { credential, email, name } = req.body;

      if (!credential && !email) {
        res.status(400).json({ error: "Missing Google credential or email" });
        return;
      }

      if (credential) {
        const session = await AuthService.verifyGoogleCredential(credential);
        res.json(session);
        return;
      }

      // If called with email/name directly in dev mode
      const session = await AuthService.demoLogin(email, name);
      res.json(session);
    } catch (err) {
      next(err);
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
    } catch (err) {
      next(err);
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
