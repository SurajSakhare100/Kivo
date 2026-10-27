import { Router } from "express";
import { TokensController } from "../controllers/tokens.controller";
import { rateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Pricing tiers are public and lightweight
router.get("/pricing", TokensController.getPricing);

// User-specific token endpoints
router.get("/balance", rateLimiter({ customLimit: 60 }), TokensController.getBalance);
router.post("/dummy-settings", rateLimiter({ customLimit: 30 }), TokensController.updateDummySettings);
router.post("/refill", rateLimiter({ customLimit: 20 }), TokensController.refillTokens);

export default router;
