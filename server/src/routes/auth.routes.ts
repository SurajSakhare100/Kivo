import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { rateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Apply auth rate limit
router.use(rateLimiter({ customLimit: 30, windowSeconds: 60 }));

router.post("/google", AuthController.googleLogin);
router.post("/demo", AuthController.demoLogin);
router.get("/me", AuthController.me);
router.post("/logout", AuthController.logout);

export default router;
