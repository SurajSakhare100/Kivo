"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { ChatPanel } from "./ChatPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ProjectDropdown } from "./ProjectDropdown";
import {
  Project,
  ProjectType,
  FilesMap,
  ChatMessage,
  ProjectCheckpoint,
  ChatStatus,
  DiagnosticItem,
  ToolCallRecord,
  BuilderStreamEvent,
} from "@/types/builder";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectFiles,
  saveFile,
  deleteFile,
  getMessages,
  saveMessage,
  createCheckpoint,
  getCheckpoints,
  restoreCheckpoint,
  undoLastCheckpoint,
} from "@/lib/storage/db";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function BuilderWorkspace({ initialProjectId }: { initialProjectId?: string }) {
  const { token, updateTokensLive, refreshBalance, openTokenSettings } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPromptFromUrl = searchParams.get("prompt");

  // Projects & Files State
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FilesMap>({});
  const [activeFile, setActiveFile] = useState<string>("app/page.tsx");
  const [checkpoints, setCheckpoints] = useState<ProjectCheckpoint[]>([]);

  // Chat & AI State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [useMockMode, setUseMockMode] = useState<boolean>(false);

  // Diagnostics
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const hasHandledUrlPrompt = useRef<boolean>(false);

  // 1. Initial Load: Initialize Database & Projects
  useEffect(() => {
    async function init() {
      try {
        const loadedProjects = await listProjects();
        if (loadedProjects.length === 0) {
          // Create initial starter project with Next.js default template
          const { project: created, files: initialFiles } = await createProject(
            "My Next.js App",
            "custom",
            "Initial Next.js application"
          );
          setProjects([created]);
          setActiveProject(created);
          setFiles(initialFiles);
          setActiveFile(created.activeFile || (initialFiles["app/page.tsx"] ? "app/page.tsx" : "src/App.tsx"));
          const promptQuery = initialPromptFromUrl
            ? `?prompt=${encodeURIComponent(initialPromptFromUrl)}`
            : "";
          router.replace(`/project/${encodeURIComponent(created.id)}${promptQuery}`, { scroll: false });

          const cps = await getCheckpoints(created.id);
          setCheckpoints(cps);
        } else {
          setProjects(loadedProjects);
          const selected = loadedProjects.find((project) => project.id === initialProjectId) ?? loadedProjects[0];
          setActiveProject(selected);
          const projectFiles = await getProjectFiles(selected.id);
          setFiles(projectFiles);
          setActiveFile(selected.activeFile || (projectFiles["app/page.tsx"] ? "app/page.tsx" : "src/App.tsx"));

          const projectMessages = await getMessages(selected.id);
          setMessages(projectMessages);

          const cps = await getCheckpoints(selected.id);
          setCheckpoints(cps);
          if (selected.id !== initialProjectId) {
            const promptQuery = initialPromptFromUrl
              ? `?prompt=${encodeURIComponent(initialPromptFromUrl)}`
              : "";
            router.replace(`/project/${encodeURIComponent(selected.id)}${promptQuery}`, { scroll: false });
          }
        }
      } catch (err) {
        console.error("Failed to initialize workspace from IndexedDB:", err);
      }
    }

    init();
  }, [initialProjectId, initialPromptFromUrl, router]);

  // 2. Handle initial prompt from query parameter (e.g. from landing page)
  useEffect(() => {
    if (
      initialPromptFromUrl &&
      activeProject &&
      Object.keys(files).length > 0 &&
      !hasHandledUrlPrompt.current &&
      !isGenerating
    ) {
      hasHandledUrlPrompt.current = true;
      handleSendMessage(initialPromptFromUrl);
    }
  }, [initialPromptFromUrl, activeProject, files, isGenerating]);

  // Project Switcher
  const handleSelectProject = async (id: string) => {
    const selected = projects.find((p) => p.id === id);
    if (!selected) return;

    setActiveProject(selected);
    const pFiles = await getProjectFiles(id);
    setFiles(pFiles);
    setActiveFile(selected.activeFile || (pFiles["app/page.tsx"] ? "app/page.tsx" : (pFiles["src/App.tsx"] ? "src/App.tsx" : Object.keys(pFiles)[0] || "app/page.tsx")));

    const pMessages = await getMessages(id);
    setMessages(pMessages);

    const cps = await getCheckpoints(id);
    setCheckpoints(cps);
    setStatus("idle");
    setStatusMessage("");
    router.push(`/project/${encodeURIComponent(id)}`, { scroll: false });
  };

  const handleCreateProject = async (name: string, type: ProjectType) => {
    const { project: created, files: newFiles } = await createProject(name, type);
    setProjects((prev) => [created, ...prev]);
    setActiveProject(created);
    setFiles(newFiles);
    setActiveFile(created.activeFile || (newFiles["app/page.tsx"] ? "app/page.tsx" : "src/App.tsx"));
    setMessages([]);
    const cps = await getCheckpoints(created.id);
    setCheckpoints(cps);
    router.push(`/project/${encodeURIComponent(created.id)}`, { scroll: false });
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    if (activeProject?.id === id) {
      if (remaining.length > 0) {
        handleSelectProject(remaining[0].id);
      } else {
        handleCreateProject("New Next.js App", "custom");
      }
    }
  };

  // File Operations
  const handleSelectFile = (path: string) => {
    setActiveFile(path);
    if (activeProject) {
      updateProject(activeProject.id, { activeFile: path });
    }
  };

  const handleCreateFile = async (path: string) => {
    if (!activeProject) return;
    const starterContent = path.endsWith(".tsx") || path.endsWith(".jsx")
      ? `import React from 'react';\n\nexport default function Component() {\n  return (\n    <div className="p-4 text-white">\n      New Component: ${path}\n    </div>\n  );\n}\n`
      : path.endsWith(".css")
      ? `/* Styles for ${path} */\n`
      : "";

    await saveFile(activeProject.id, path, starterContent);
    setFiles((prev) => ({ ...prev, [path]: starterContent }));
    setActiveFile(path);
  };

  const handleDeleteFile = async (path: string) => {
    if (!activeProject) return;
    await deleteFile(activeProject.id, path);
    setFiles((prev) => {
      const copy = { ...prev };
      delete copy[path];
      return copy;
    });
    if (activeFile === path) {
      setActiveFile((prevFiles: any) => (prevFiles?.["app/page.tsx"] ? "app/page.tsx" : "src/App.tsx"));
    }
  };

  const handleCodeChange = async (path: string, newContent: string) => {
    if (!activeProject) return;
    setFiles((prev) => ({ ...prev, [path]: newContent }));
    await saveFile(activeProject.id, path, newContent);
  };

  // Checkpoints & Undo Operations
  const handleRestoreCheckpoint = async (checkpointId: string) => {
    if (!activeProject) return;
    const res = await restoreCheckpoint(checkpointId);
    if (res) {
      setFiles(res.files);
      const updatedCps = await getCheckpoints(activeProject.id);
      setCheckpoints(updatedCps);
    }
  };

  const handleUndoLastCheckpoint = async () => {
    if (!activeProject) return;
    const restoredFiles = await undoLastCheckpoint(activeProject.id);
    if (restoredFiles) {
      setFiles(restoredFiles);
      const updatedCps = await getCheckpoints(activeProject.id);
      setCheckpoints(updatedCps);
    }
  };

  // Diagnostic Handlers
  const handleAddDiagnostic = useCallback((item: DiagnosticItem) => {
    setDiagnostics((prev) => {
      // Deduplicate recent identical messages
      if (prev.some((p) => p.message === item.message && p.line === item.line)) {
        return prev;
      }
      return [item, ...prev.slice(0, 19)];
    });
  }, []);

  const handleClearDiagnostics = useCallback(() => {
    setDiagnostics([]);
  }, []);

  const handleCancelGeneration = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setStatus("idle");
    setStatusMessage("Generation cancelled.");
  };

  // 3. AI Code Generation & Structured Tool Orchestration
  const handleSendMessage = async (promptText: string) => {
    if (!activeProject || isGenerating) return;

    setIsGenerating(true);
    setStatus("planning");
    setStatusMessage("Creating checkpoint and preparing session...");

    // SAVE CHECKPOINT BEFORE APPLYING MODIFICATIONS!
    const summary = `Before: ${promptText.slice(0, 35)}${promptText.length > 35 ? "..." : ""}`;
    const newCheckpoint = await createCheckpoint(activeProject.id, summary, undefined, files);
    setCheckpoints((prev) => [newCheckpoint, ...prev]);

    // Create user chat message
    const userMsg: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      projectId: activeProject.id,
      role: "user",
      content: promptText,
      timestamp: new Date().toISOString(),
    };

    // Placeholder assistant message
    const assistantMsgId = "msg_" + Math.random().toString(36).substring(2, 9);
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      projectId: activeProject.id,
      role: "assistant",
      content: "",
      status: "planning",
      timestamp: new Date().toISOString(),
      toolCalls: [],
      checkpointId: newCheckpoint.id,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    await saveMessage(userMsg);

    abortControllerRef.current = new AbortController();

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: promptText,
          projectId: activeProject.id,
          projectSummary: activeProject.description || activeProject.name,
          files,
          history: historyPayload,
          forceMock: useMockMode,
          diagnostics: diagnostics.map((d) => d.message),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 429) {
          const limitMsg = errorData.message || "Token limit or rate limit exceeded!";
          setStatus("error");
          setStatusMessage(limitMsg);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: `⚠️ **${errorData.error || "Limit Exceeded"}**: ${limitMsg}\n\nPlease refill your tokens or adjust your dummy token limit in Settings.`,
                    status: "error",
                  }
                : m
            )
          );
          openTokenSettings();
          return;
        }
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No response body received from server");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let updatedPlan = "";
      let updatedSummary = "";
      let toolCallsList: ToolCallRecord[] = [];
      let currentFilesMap = { ...files };
      let generationError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.replace(/^data: /, "").trim();
          if (!jsonStr) continue;

          try {
            const event: BuilderStreamEvent = JSON.parse(jsonStr);

            if (event.type === "status") {
              setStatus(event.status);
              if (event.message) setStatusMessage(event.message);
            } else if (event.type === "plan") {
              updatedPlan = event.plan;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, plan: updatedPlan } : m
                )
              );
            } else if (event.type === "tool_call") {
              const tc: ToolCallRecord = {
                id: event.id,
                tool: event.tool as any,
                args: event.args,
                status: "executing",
              };
              toolCallsList = [...toolCallsList, tc];
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, toolCalls: toolCallsList } : m
                )
              );
            } else if (event.type === "tool_result") {
              let toolError: string | undefined;
              if (typeof event.result === "string") {
                try {
                  const parsedResult = JSON.parse(event.result);
                  if (parsedResult?.error) {
                    toolError = typeof parsedResult.error === "string"
                      ? parsedResult.error
                      : JSON.stringify(parsedResult.error);
                  }
                } catch {
                  // Plain-text file contents and search results are valid tool results.
                }
              } else if (event.result && typeof event.result === "object" && "error" in event.result) {
                const resultError = (event.result as { error: unknown }).error;
                toolError = typeof resultError === "string" ? resultError : JSON.stringify(resultError);
              }
              toolCallsList = toolCallsList.map((t) =>
                t.id === event.id
                  ? { ...t, status: toolError ? "error" : "success", error: toolError, result: event.result }
                  : t
              );
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, toolCalls: toolCallsList } : m
                )
              );
            } else if (event.type === "file_change") {
              if (event.action === "create" || event.action === "update") {
                if (event.content !== undefined) {
                  currentFilesMap[event.path] = event.content;
                  setFiles({ ...currentFilesMap });
                  // Save to IndexedDB
                  await saveFile(activeProject.id, event.path, event.content);
                }
              } else if (event.action === "delete") {
                delete currentFilesMap[event.path];
                setFiles({ ...currentFilesMap });
                await deleteFile(activeProject.id, event.path);
              }
            } else if (event.type === "summary") {
              updatedSummary = event.summary;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: updatedSummary,
                        tokensUsed: event.tokensUsed,
                        generationTime: event.generationTime,
                        status: "completed",
                      }
                    : m
                )
              );
            } else if ((event as any).type === "token_usage") {
              const tu = event as any;
              updateTokensLive({
                tokensUsed: tu.totalTokensUsed,
                tokensRemaining: tu.tokensRemaining,
                tokenLimit: tu.tokenLimit,
                plan: tu.plan,
              });
            } else if (event.type === "error") {
              generationError = event.error;
              setStatus("error");
              setStatusMessage(event.error);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: `Error: ${event.error}`,
                        status: "error",
                      }
                    : m
                )
              );
            }
          } catch (e) {
            console.error("Failed to parse SSE event chunk:", e, line);
          }
        }
      }

      if (generationError) {
        throw new Error(generationError);
      }

      // Refresh balance after stream completes
      refreshBalance();

      // Finalize assistant message in IndexedDB
      const finalMsg: ChatMessage = {
        id: assistantMsgId,
        projectId: activeProject.id,
        role: "assistant",
        content: updatedSummary || "Modifications completed.",
        plan: updatedPlan,
        toolCalls: toolCallsList,
        status: "completed",
        timestamp: new Date().toISOString(),
      };
      await saveMessage(finalMsg);

      setStatus("completed");
      setStatusMessage("Application updated successfully.");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus("idle");
        setStatusMessage("Cancelled.");
        return;
      }
      const errorMsg = err instanceof Error ? err.message : String(err);
      setStatus("error");
      setStatusMessage(errorMsg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: `Error encountered: ${errorMsg}`, status: "error" }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-neutral-100 antialiased font-sans">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center border-b border-neutral-800 bg-[#09090b]">
          <div className="flex h-full w-64 shrink-0 items-center border-r border-neutral-800 px-4">
            <div
              aria-label="Kivo"
              title="Kivo"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-xs font-bold text-black"
            >
              K
            </div>
          </div>
          <div className="min-w-0 flex-1 px-4">
            <ProjectDropdown
              projects={projects}
              activeProject={activeProject}
              onSelectProject={handleSelectProject}
              onCreateProject={handleCreateProject}
              onDeleteProject={handleDeleteProject}
            />
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <Sidebar
            files={files}
            activeFile={activeFile}
            checkpoints={checkpoints}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onRestoreCheckpoint={handleRestoreCheckpoint}
            onUndoLastCheckpoint={handleUndoLastCheckpoint}
          />

          <ChatPanel
            messages={messages}
            status={status}
            statusMessage={statusMessage}
            isGenerating={isGenerating}
            useMockMode={useMockMode}
            onToggleMockMode={setUseMockMode}
            onSendMessage={handleSendMessage}
            onCancelGeneration={handleCancelGeneration}
            onUndoLastCheckpoint={handleUndoLastCheckpoint}
            canUndo={checkpoints.length >= 2}
          />
        </div>
      </div>

      <PreviewPanel
        files={files}
        activeFile={activeFile}
        onCodeChange={handleCodeChange}
        diagnostics={diagnostics}
        onAddDiagnostic={handleAddDiagnostic}
        onClearDiagnostics={handleClearDiagnostics}
        onAskAiToFix={(err) => handleSendMessage(`Fix this error: ${err}`)}
      />
    </div>
  );
}
