import { Request, Response, NextFunction } from "express";
import { TokenService } from "../services/token.service";

export class TokensController {
  /**
   * Get user's live token balance and plan details
   */
  static async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      const balance = await TokenService.getUserBalance(userId);
      res.json(balance);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get token-based pricing tiers
   */
  static async getPricing(_req: Request, res: Response): Promise<void> {
    const pricing = TokenService.getPricingPlans();
    res.json(pricing);
  }

  /**
   * Update dummy settings for token limits (User requested)
   */
  static async updateDummySettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      const { plan, customLimit, resetUsage, simulateExhaustion, refillAmount } = req.body;

      const updated = await TokenService.updateDummySettings(userId, {
        plan,
        customLimit: customLimit !== undefined ? Number(customLimit) : undefined,
        resetUsage: Boolean(resetUsage),
        simulateExhaustion: Boolean(simulateExhaustion),
        refillAmount: refillAmount !== undefined ? Number(refillAmount) : undefined,
      });

      res.json({
        success: true,
        message: "Dummy token settings updated successfully",
        profile: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Refill tokens endpoint
   */
  static async refillTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      const amount = Number(req.body.amount || 50000);

      const updated = await TokenService.updateDummySettings(userId, {
        refillAmount: amount,
      });

      res.json({
        success: true,
        message: `Successfully refilled ${amount.toLocaleString()} tokens`,
        profile: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
