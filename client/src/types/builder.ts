export type ProjectType =
  | "landing_page"
  | "dashboard"
  | "portfolio"
  | "ecommerce"
  | "blog"
  | "custom";

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  description?: string;
  activeFile: string;
  createdAt: string;
  updatedAt: string;
}

export type FilesMap = Record<string, string>;

export interface ProjectFile {
  path: string;
  content: string;
  updatedAt: string;
}

export type ToolName =
  | "list_files"
  | "read_file"
  | "create_file"
  | "update_file"
  | "delete_file"
  | "get_diagnostics"
  | "search"
  | "search_files"
  | "web_search"
  | "web_search_ddg"
  | "add_package";

export interface ToolCallRecord {
  id: string;
  tool: ToolName;
  args: Record<string, unknown>;
  result?: unknown;
  status: "executing" | "success" | "error";
  error?: string;
}

export type ChatStatus =
  | "idle"
  | "planning"
  | "editing"
  | "building"
  | "completed"
  | "error";

/** SSE contract shared with the Express AI service. */
export type BuilderStreamEvent =
  | { type: "status"; status: "planning" | "editing" | "building" | "completed" | "error"; message?: string }
  | { type: "plan"; plan: string }
  | { type: "tool_call"; id: string; tool: string; args: Record<string, unknown> }
  | { type: "tool_result"; id: string; tool: string; result: unknown }
  | { type: "file_change"; action: "create" | "update" | "delete"; path: string; content?: string; explanation?: string }
  | { type: "diagnostics"; status: "clean" | "issues_found"; details?: string }
  | { type: "summary"; summary: string; tokensUsed?: number; generationTime?: number }
  | { type: "error"; error: string }
  | { type: "token_usage"; tokensUsedThisRequest: number; totalTokensUsed: number; tokensRemaining: number; tokenLimit: number; plan: string };

export interface ChatMessage {
  id: string;
  projectId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  status?: ChatStatus;
  plan?: string;
  toolCalls?: ToolCallRecord[];
  tokensUsed?: number;
  generationTime?: number;
  checkpointId?: string;
}

export interface ProjectCheckpoint {
  id: string;
  projectId: string;
  messageId?: string;
  summary: string;
  files: FilesMap;
  createdAt: string;
}

export interface DiagnosticItem {
  id: string;
  type: "error" | "warning" | "info";
  file?: string;
  line?: number;
  column?: number;
  message: string;
  source?: "bundler" | "vite" | "runtime" | "security";
  timestamp: string;
}

export type ViewportMode = "desktop" | "tablet" | "mobile";

export type PanelTab = "preview" | "code" | "plan" | "diagnostics";
