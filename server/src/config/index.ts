import dotenv from "dotenv";
import path from "path";

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const configuredModel = process.env.DEFAULT_MODEL?.trim();
const defaultGroqModel = configuredModel || "llama-3.3-70b-versatile";

export interface PricingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  monthlyTokens: number;
  rateLimitPerMin: number;
  badge?: string;
  description: string;
  features: string[];
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
  guest: {
    id: "guest",
    name: "Guest Trial",
    priceMonthly: 0,
    monthlyTokens: 15000,
    rateLimitPerMin: 10,
    description: "Try out Kivo AI Builder with quick prompts without signing in.",
    features: [
      "15,000 tokens included",
      "10 requests/minute",
      "Standard generation speed",
      "Ephemeral workspace",
    ],
  },
  free: {
    id: "free",
    name: "Free Explorer",
    priceMonthly: 0,
    monthlyTokens: 50000,
    rateLimitPerMin: 20,
    badge: "Popular",
    description: "Great for hobbyists and individual developers creating prototypes.",
    features: [
      "50,000 tokens per month",
      "20 requests/minute",
      "High-speed AI Engine",
      "Full live preview",
      "Version checkpoints & rollbacks",
      "Standard community support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro Builder",
    priceMonthly: 19,
    monthlyTokens: 500000,
    rateLimitPerMin: 60,
    badge: "Best Value",
    description: "For active builders requiring high volume and priority throughput.",
    features: [
      "500,000 tokens per month",
      "60 requests/minute",
      "Priority Cloud Queue",
      "Unlimited project saves",
      "Full source code export (ZIP)",
      "Priority error recovery & diagnostics",
    ],
  },
  team: {
    id: "team",
    name: "Team / Scale",
    priceMonthly: 49,
    monthlyTokens: 2000000,
    rateLimitPerMin: 180,
    description: "Unleash limitless AI app generation for teams and power agencies.",
    features: [
      "2,000,000 tokens per month",
      "180 requests/minute",
      "Dedicated Redis rate limit bucket",
      "Multi-project concurrency",
      "Custom system prompt injection",
      "24/7 Priority developer support",
    ],
  },
};

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000").split(","),
  
  // Redis Configuration
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  
  // Auth & JWT
  jwtSecret: process.env.JWT_SECRET || "kivo_jwt_secret_dev_key_2026_antigravity",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  
  // Groq / LLM
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqBaseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
  defaultModel: defaultGroqModel,
  fallbackModel: process.env.FALLBACK_MODEL || "llama-3.1-8b-instant",
  
  // Default token limits
  defaultPlan: "free",
  pricingPlans: PRICING_PLANS,
};
