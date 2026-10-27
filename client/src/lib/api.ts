// API client for Kivo backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface GenerateRequest {
  prompt: string;
  project_type: "landing_page" | "dashboard" | "portfolio" | "ecommerce" | "blog" | "custom";
  project_name: string;
  stream?: boolean;
  existing_code?: string;   // current code sent as context for follow-up edits
  project_id?: string;      // existing project ID to update
}

export interface GenerateResponse {
  id: string;
  project_name: string;
  project_type: string;
  prompt: string;
  code: string;
  plan?: string;
  status: string;
  tokens_used: number;
  generation_time: number;
  error?: string;
  folder_path?: string;
  created_at: string;
}

export interface ProjectSummary {
  id: string;
  project_name: string;
  project_type: string;
  prompt: string;
  status: string;
  created_at: string;
}

export type StreamEvent =
  | { event: "progress"; step: string; label: string; status: string; plan?: string; error?: string }
  | { event: "complete"; code: string; plan: string; status: string; tokens_used: number; generation_time: number; project_id?: string; folder_path?: string; error?: string }
  | { event: "error"; error: string; violation_type?: string };

// ─── Non-streaming generate ────────────────────────────────────────────────────

export async function generateWebsite(req: GenerateRequest): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/api/v1/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Generation failed");
  }
  return res.json();
}

// ─── SSE Streaming generate ───────────────────────────────────────────────────

export async function* streamGenerateWebsite(
  req: GenerateRequest,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const res = await fetch(`${API_BASE}/api/v1/generate/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Stream failed");
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          yield JSON.parse(line.slice(6)) as StreamEvent;
        } catch {}
      }
    }
  }
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function listProjects(): Promise<ProjectSummary[]> {
  const res = await fetch(`${API_BASE}/api/v1/projects`);
  if (!res.ok) throw new Error("Failed to list projects");
  return res.json();
}

export async function getProject(id: string): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/api/v1/projects/${id}`);
  if (!res.ok) throw new Error("Project not found");
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  await fetch(`${API_BASE}/api/v1/projects/${id}`, { method: "DELETE" });
}

export async function updateProjectCode(id: string, code: string): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/api/v1/projects/${id}/code`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Save failed");
  }
  return res.json();
}

export function getPreviewUrl(id: string): string {
  return `${API_BASE}/api/v1/projects/${id}/preview`;
}
