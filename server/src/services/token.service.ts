import { PRICING_PLANS, PricingPlan } from "../config";
import {
  getUserTokenProfile,
  updateDummyTokenSettings,
  UserTokenProfile,
  deductTokens,
} from "../redis/tokenUsage";

export class TokenService {
  /**
   * Return all pricing plans and token quotas
   */
  static getPricingPlans(): { plans: PricingPlan[]; currentCurrency: string } {
    return {
      plans: Object.values(PRICING_PLANS),
      currentCurrency: "USD",
    };
  }

  /**
   * Get user's live token profile
   */
  static async getUserBalance(userId: string): Promise<UserTokenProfile> {
    return getUserTokenProfile(userId);
  }

  /**
   * Update dummy token settings: change custom limit or switch plan tier
   */
  static async updateDummySettings(
    userId: string,
    params: {
      plan?: string;
      customLimit?: number;
      resetUsage?: boolean;
      simulateExhaustion?: boolean;
      refillAmount?: number;
    }
  ): Promise<UserTokenProfile> {
    return updateDummyTokenSettings(userId, params);
  }

  /**
   * Record token consumption
   */
  static async consumeTokens(
    userId: string,
    tokens: number
  ): Promise<UserTokenProfile> {
    return deductTokens(userId, tokens);
  }
}
