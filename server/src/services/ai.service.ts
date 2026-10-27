import type { Response } from "express";
import { getAIProvider } from "../ai/providers";
import { TokenService } from "./token.service";

export interface ChatGeneratePayload {
  prompt: string;
  projectId?: string;
  projectSummary?: string;
  files: Record<string, string>;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  forceMock?: boolean;
  diagnostics?: string[];
}

export class AIService {
  static estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.max(1, Math.ceil(text.length / 4));
  }

  /** Stream structured planning, search, and file operations from the shared AI provider. */
  static async streamGeneration(
    userId: string,
    payload: ChatGeneratePayload,
    res: Response
  ): Promise<void> {
    const sendEvent = (event: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };
    const provider = getAIProvider(Boolean(payload.forceMock));
    let tokensUsed = 0;
    let failed = false;

    sendEvent({
      type: "status",
      status: "planning",
      message: `Connected to ${provider.name}${provider.isMock ? " (Mock Mode)" : ""}`,
    });

    try {
      for await (const event of provider.generate({
        prompt: payload.prompt,
        projectSummary: payload.projectSummary || "React + Vite App",
        files: payload.files,
        history: payload.history || [],
        diagnostics: payload.diagnostics || [],
      })) {
        if (event.type === "summary" && typeof event.tokensUsed === "number") {
          tokensUsed = event.tokensUsed;
        }
        if (event.type === "error") failed = true;
        sendEvent(event);
      }
    } catch (err: unknown) {
      failed = true;
      sendEvent({
        type: "error",
        error: err instanceof Error ? err.message : "AI generation failed unexpectedly.",
      });
    }

    if (failed) return;

    const estimatedTokens = this.estimateTokens(payload.prompt) +
      Object.values(payload.files).reduce((total, file) => total + this.estimateTokens(file), 0);
    const totalTokensConsumed = Math.max(tokensUsed, estimatedTokens);
    const updatedBalance = await TokenService.consumeTokens(userId, totalTokensConsumed);

    sendEvent({
      type: "token_usage",
      tokensUsedThisRequest: totalTokensConsumed,
      totalTokensUsed: updatedBalance.tokensUsed,
      tokensRemaining: updatedBalance.tokensRemaining,
      tokenLimit: updatedBalance.tokenLimit,
      plan: updatedBalance.plan,
    });
  }
}
