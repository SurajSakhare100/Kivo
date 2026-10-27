import { Request, Response, NextFunction } from "express";
import { AIService, ChatGeneratePayload } from "../services/ai.service";

export class ChatController {
  static async handleStream(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { prompt, projectId, projectSummary, files, history, forceMock, diagnostics } = req.body;

      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "Field 'prompt' is required and must be a string." });
        return;
      }

      if (!files || typeof files !== "object") {
        res.status(400).json({ error: "Field 'files' is required and must be an object map of file paths to content." });
        return;
      }

      // Configure SSE Headers
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders?.();

      const payload: ChatGeneratePayload = {
        prompt,
        projectId,
        projectSummary,
        files,
        history,
        forceMock,
        diagnostics,
      };

      const userId = req.userId;

      await AIService.streamGeneration(userId, payload, res);
      res.end();
    } catch (err) {
      console.error("[Chat Stream Error]", err);
      if (!res.headersSent) {
        next(err);
      } else {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Internal streaming error" })}\n\n`);
        res.end();
      }
    }
  }
}
