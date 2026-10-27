import { getRedisClient } from "./client";
import { config, PRICING_PLANS, PricingPlan } from "../config";

export interface UserTokenProfile {
  userId: string;
  plan: string;
  planDetails: PricingPlan;
  tokenLimit: number;
  tokensUsed: number;
  tokensRemaining: number;
  percentUsed: number;
  isCustomLimit: boolean;
  cycleStart: string;
  lastUpdated: string;
}

/**
 * Key format: `user:tokens:{userId}`
 */
function getUserKey(userId: string): string {
  return `user:tokens:${userId}`;
}

/**
 * Retrieve or initialize a user's token profile from Redis
 */
export async function getUserTokenProfile(userId: string, defaultPlanId = "free"): Promise<UserTokenProfile> {
  const redis = getRedisClient();
  const key = getUserKey(userId);

  const data = await redis.hgetall(key);
  const planId = data.plan || defaultPlanId;
  const planDetails = PRICING_PLANS[planId] || PRICING_PLANS.free;

  // If user has no record in Redis yet, initialize it
  if (!data.tokenLimit) {
    const initialLimit = planDetails.monthlyTokens;
    const initialUsed = 0;
    const now = new Date().toISOString();

    await redis.hset(
      key,
      "userId", userId,
      "plan", planId,
      "tokenLimit", String(initialLimit),
      "tokensUsed", String(initialUsed),
      "isCustomLimit", "false",
      "cycleStart", now,
      "lastUpdated", now
    );

    return {
      userId,
      plan: planId,
      planDetails,
      tokenLimit: initialLimit,
      tokensUsed: initialUsed,
      tokensRemaining: initialLimit,
      percentUsed: 0,
      isCustomLimit: false,
      cycleStart: now,
      lastUpdated: now,
    };
  }

  const tokenLimit = parseInt(data.tokenLimit, 10) || planDetails.monthlyTokens;
  const tokensUsed = parseInt(data.tokensUsed, 10) || 0;
  const tokensRemaining = Math.max(0, tokenLimit - tokensUsed);
  const percentUsed = tokenLimit > 0 ? Math.min(100, Math.round((tokensUsed / tokenLimit) * 100)) : 100;
  const isCustomLimit = data.isCustomLimit === "true";

  return {
    userId,
    plan: planId,
    planDetails,
    tokenLimit,
    tokensUsed,
    tokensRemaining,
    percentUsed,
    isCustomLimit,
    cycleStart: data.cycleStart || new Date().toISOString(),
    lastUpdated: data.lastUpdated || new Date().toISOString(),
  };
}

/**
 * Atomically check if the user has enough tokens for an operation
 */
export async function hasSufficientTokens(userId: string, requiredTokens = 100): Promise<{
  sufficient: boolean;
  profile: UserTokenProfile;
}> {
  const profile = await getUserTokenProfile(userId);
  return {
    sufficient: profile.tokensRemaining >= requiredTokens,
    profile,
  };
}

/**
 * Atomically deduct tokens consumed by an AI prompt/completion
 */
export async function deductTokens(
  userId: string,
  tokensConsumed: number
): Promise<UserTokenProfile> {
  const redis = getRedisClient();
  const key = getUserKey(userId);

  // Ensure record exists
  await getUserTokenProfile(userId);

  // Atomically increment tokensUsed in Redis
  const newUsed = await redis.incrby(`${key}:counter`, tokensConsumed);
  
  // Keep the hash synchronized
  await redis.hset(key, "tokensUsed", String(newUsed), "lastUpdated", new Date().toISOString());

  return getUserTokenProfile(userId);
}

/**
 * Dummy setting for token limits:
 * Allows user to change their token limit, switch plan tiers, or refill balance for testing
 */
export async function updateDummyTokenSettings(
  userId: string,
  params: {
    plan?: string;
    customLimit?: number;
    resetUsage?: boolean;
    simulateExhaustion?: boolean;
    refillAmount?: number;
  }
): Promise<UserTokenProfile> {
  const redis = getRedisClient();
  const key = getUserKey(userId);
  const current = await getUserTokenProfile(userId);

  let newPlan = params.plan || current.plan;
  const planDetails = PRICING_PLANS[newPlan] || PRICING_PLANS.free;

  let newLimit = params.customLimit !== undefined ? params.customLimit : planDetails.monthlyTokens;
  let isCustom = params.customLimit !== undefined;

  let newUsed = current.tokensUsed;

  if (params.resetUsage) {
    newUsed = 0;
    // reset atomic counter
    await redis.set(`${key}:counter`, "0");
  } else if (params.simulateExhaustion) {
    newUsed = newLimit;
    await redis.set(`${key}:counter`, String(newUsed));
  } else if (params.refillAmount) {
    newUsed = Math.max(0, newUsed - params.refillAmount);
    await redis.set(`${key}:counter`, String(newUsed));
  }

  const now = new Date().toISOString();

  await redis.hset(
    key,
    "userId", userId,
    "plan", newPlan,
    "tokenLimit", String(newLimit),
    "tokensUsed", String(newUsed),
    "isCustomLimit", String(isCustom),
    "lastUpdated", now
  );

  return getUserTokenProfile(userId);
}
