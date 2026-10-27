import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { rateLimiter } from "../middleware/rateLimiter";
import { requireTokenBalance } from "../middleware/tokenGate";

const router = Router();

// Rate limiting + Token Balance verification before streaming
router.post(
  "/",
  rateLimiter(),
  requireTokenBalance(200),
  ChatController.handleStream
);

export default router;
