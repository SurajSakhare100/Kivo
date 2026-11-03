import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { rateLimiter } from "../middleware/rateLimiter";
import { requireTokenBalance } from "../middleware/tokenGate";

const router = Router();

// Rate limiting + Token Balance verification before streaming
// Client calls POST /api/chat/stream
router.post(
  "/stream",
  rateLimiter(),
  requireTokenBalance(200),
  ChatController.handleStream
);

// Alias: POST /api/chat (backward compat)
router.post(
  "/",
  rateLimiter(),
  requireTokenBalance(200),
  ChatController.handleStream
);

export default router;
