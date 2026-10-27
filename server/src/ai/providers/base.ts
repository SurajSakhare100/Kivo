export type FilesMap = Record<string, string>;

export type StreamEvent =
  | { type: "status"; status: "planning" | "editing" | "building" | "completed" | "error"; message?: string }
  | { type: "plan"; plan: string }
  | { type: "tool_call"; id: string; tool: string; args: Record<string, unknown> }
  | { type: "tool_result"; id: string; tool: string; result: unknown }
  | { type: "file_change"; action: "create" | "update" | "delete"; path: string; content?: string; explanation?: string }
  | { type: "diagnostics"; status: "clean" | "issues_found"; details?: string }
  | { type: "summary"; summary: string; tokensUsed?: number; generationTime?: number }
  | { type: "error"; error: string };

export interface AIRequestContext {
  prompt: string;
  projectSummary: string;
  files: FilesMap;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  diagnostics?: string[];
}

export interface AIProvider {
  name: string;
  isMock: boolean;
  generate(context: AIRequestContext): AsyncGenerator<StreamEvent, void, unknown>;
}
