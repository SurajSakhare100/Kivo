import { Request, Response, NextFunction } from "express";
import { hasSufficientTokens } from "../redis/tokenUsage";

/**
 * Middleware ensuring user has sufficient tokens before initiating expensive AI workloads
 */
export function requireTokenBalance(minTokens = 200) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId;
      const { sufficient, profile } = await hasSufficientTokens(userId, minTokens);

      res.setHeader("X-Tokens-Remaining", profile.tokensRemaining);
      res.setHeader("X-Tokens-Limit", profile.tokenLimit);
      res.setHeader("X-Tokens-Plan", profile.plan);

      if (!sufficient) {
        res.status(429).json({
          error: "Token limit exceeded",
          code: "TOKEN_LIMIT_EXCEEDED",
          message: `You have consumed all ${profile.tokenLimit.toLocaleString()} tokens available in your ${profile.plan.toUpperCase()} tier.`,
          tokensRemaining: profile.tokensRemaining,
          tokensUsed: profile.tokensUsed,
          tokenLimit: profile.tokenLimit,
          plan: profile.plan,
          canUpgradeOrRefill: true,
        });
        return;
      }

      next();
    } catch (err) {
      console.error("[TokenGate Error]", err);
      next();
    }
  };
}
