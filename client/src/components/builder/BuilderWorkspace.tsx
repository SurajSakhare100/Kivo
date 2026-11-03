"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  Code2,
  Settings,
  Share2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Download,
  Check,
  Zap,
  LogOut,
} from "lucide-react";
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
  ToolName,
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

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_API_URL ||
  "http://localhost:5000";

export default function BuilderWorkspace({ initialProjectId }: { initialProjectId?: string }) {
  const { user, token, updateTokensLive, refreshBalance, openTokenSettings, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPromptFromUrl = searchParams.get("prompt");

  // Projects & Files State
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FilesMap>({});
  const [activeFile, setActiveFile] = useState<string>("app/page.tsx");
  const [checkpoints, setCheckpoints] = useState<ProjectCheckpoint[]>([]);

  // View toggle: "preview" or "code" (Image 3)
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

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
          setActiveFile(selected.activeFile || (projectFiles["app/page.tsx"] ? "app/page.tsx" : (projectFiles["src/App.tsx"] ? "src/App.tsx" : Object.keys(projectFiles)[0] || "app/page.tsx")));

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
      ? `import React from 'react';\n\nexport default function Component() {\n  return (\n    <div className="p-4 text-neutral-900">\n      New Component: ${path}\n    </div>\n  );\n}\n`
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setStatus("idle");
    setStatusMessage("Generation cancelled.");
  };

  // Send message & AI Code Stream
  const handleSendMessage = async (promptText: string) => {
    if (!activeProject || isGenerating) return;

    const userMsgId = `msg_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      projectId: activeProject.id,
      role: "user",
      content: promptText,
      timestamp: new Date().toISOString(),
    };

    await saveMessage(userMsg);
    setMessages((prev) => [...prev, userMsg]);

    const checkpointTitle = promptText.slice(0, 32).trim() + (promptText.length > 32 ? "..." : "");
    await createCheckpoint(activeProject.id, checkpointTitle, undefined, files);
    const updatedCheckpoints = await getCheckpoints(activeProject.id);
    setCheckpoints(updatedCheckpoints);

    setIsGenerating(true);
    setStatus("planning");
    setStatusMessage("Planning architecture & code changes...");

    const assistantMsgId = `msg_${Date.now() + 1}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      projectId: activeProject.id,
      role: "assistant",
      content: "Analyzing request...",
      status: "planning",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, initialAssistantMsg]);

    try {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/api/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: promptText,
          projectType: activeProject.type,
          files,
          activeFile,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          mockMode: useMockMode,
        }),
        signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || `Server responded with ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No readable stream response");

      const decoder = new TextDecoder();
      let buffer = "";
      const workingFiles: FilesMap = { ...files };
      let toolCallsList: ToolCallRecord[] = [];
      let updatedPlan = "";
      let updatedSummary = "";
      let generationError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event: BuilderStreamEvent = JSON.parse(jsonStr);

            if (event.type === "status") {
              setStatus(event.status);
              if (event.message) setStatusMessage(event.message);
            } else if (event.type === "plan") {
              updatedPlan = event.plan;
              setStatus("planning");
              setStatusMessage("Executing architectural plan...");
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, plan: updatedPlan } : m))
              );
            } else if (event.type === "tool_call") {
              const tc: ToolCallRecord = {
                id: event.id,
                tool: event.tool as ToolName,
                args: event.args || {},
                status: "executing",
              };
              toolCallsList = [...toolCallsList, tc];
              setStatus("editing");
              const targetPath = (event.args?.path as string) || "files";
              setStatusMessage(`Applying changes to ${targetPath}...`);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, toolCalls: toolCallsList, content: "Executing edits..." } : m
                )
              );
            } else if (event.type === "tool_result") {
              toolCallsList = toolCallsList.map((t) =>
                t.id === event.id ? { ...t, status: "success", result: event.result } : t
              );
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, toolCalls: toolCallsList } : m))
              );
            } else if (event.type === "file_change") {
              if (event.action === "update" || event.action === "create") {
                if (event.content !== undefined) {
                  workingFiles[event.path] = event.content;
                  setFiles({ ...workingFiles });
                  await saveFile(activeProject.id, event.path, event.content);
                }
              } else if (event.action === "delete") {
                delete workingFiles[event.path];
                setFiles({ ...workingFiles });
                await deleteFile(activeProject.id, event.path);
              }
            } else if (event.type === "summary") {
              updatedSummary = event.summary;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, content: updatedSummary } : m))
              );
            } else if (event.type === "token_usage") {
              updateTokensLive({
                tokensRemaining: event.tokensRemaining,
                tokensUsed: event.totalTokensUsed,
                percentUsed: Math.round((event.totalTokensUsed / (event.tokenLimit || 1)) * 100),
                tokenLimit: event.tokenLimit,
              });
            } else if (event.type === "error") {
              generationError = event.error;
              setStatus("error");
              setStatusMessage(event.error);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: `Error: ${event.error}`, status: "error" } : m
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

      refreshBalance();

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

  const userName = user?.name ? user.name.split(" ")[0] : "suraj";
  const latestCheckpoint = checkpoints[checkpoints.length - 1];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-neutral-900 antialiased font-sans flex-col select-none">
      {/* ─────────────────────────────────────────────────────────
          TOP NAVBAR (Matches Image 3)
          ───────────────────────────────────────────────────────── */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-3 sm:px-4 z-20">
        {/* Left: Logo, User Badge, Project Title, "New" badge */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 group mr-1 cursor-pointer"
            title="Back to dashboard"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-xs font-bold text-white shadow-2xs group-hover:scale-105 transition-transform">
              K
            </div>
          </Link>

          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 transition cursor-pointer p-0.5 rounded-md hover:bg-neutral-100"
              title="Account Menu"
            >
              <span className="h-5 w-5 rounded-md bg-fuchsia-600 text-white font-bold text-[10px] flex items-center justify-center">
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="text-neutral-300">/</span>
            </button>

            {isProfileMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-neutral-200 bg-white shadow-xl z-50 p-1.5 text-xs animate-in fade-in slide-in-from-top-1">
                <div className="px-2.5 py-2 border-b border-neutral-100">
                  <p className="font-semibold text-neutral-900 truncate">
                    {user?.name || `${userName}'s Workspace`}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {user?.email || "Google Account"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    openTokenSettings();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-700 hover:bg-neutral-100 transition cursor-pointer mt-1"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Workspace Settings</span>
                </button>
                <div className="my-1 border-t border-neutral-100" />
                <button
                  onClick={async () => {
                    setIsProfileMenuOpen(false);
                    await logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>

          <ProjectDropdown
            projects={projects}
            activeProject={activeProject}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
          />

          <span className="hidden sm:inline text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full ml-1">
            New
          </span>
        </div>

        {/* Center: Segmented Controls [ 👁 Preview ] [ </> Code ] [ ⚙ Settings ] */}
        <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-100 p-0.5 text-xs font-semibold shadow-2xs">
          <button
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
              viewMode === "preview"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview</span>
          </button>

          <button
            onClick={() => setViewMode("code")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
              viewMode === "code"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Code</span>
          </button>

          <button
            onClick={openTokenSettings}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg transition cursor-pointer"
            title="Project & Token Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right: GitHub, Upgrade, Share, Publish button */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition"
            title="GitHub Repository"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>

          <button
            onClick={openTokenSettings}
            className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition cursor-pointer shadow-2xs"
          >
            Upgrade
          </button>

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                navigator.clipboard.writeText(window.location.href);
                alert("Project link copied to clipboard!");
              }
            }}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition cursor-pointer shadow-2xs"
          >
            <Share2 className="h-3 w-3" />
            <span>Share</span>
          </button>

          <button
            onClick={() => {
              const zipName = `${activeProject?.name || "project"}.json`;
              const blob = new Blob([JSON.stringify(files, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = zipName;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition active:scale-98 cursor-pointer"
          >
            <span>Publish</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────
          SPLIT VIEW WORKSPACE (Image 3)
          ───────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Column: Chat Panel (~38% width) */}
        <div className="w-[38%] min-w-[340px] max-w-[480px] h-full flex flex-col shrink-0">
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
            latestCheckpointTitle={latestCheckpoint?.summary || activeProject?.name}
          />
        </div>

        {/* Right Column: Code Mode (Files + Monaco) OR Preview Mode (~62% width) */}
        <div className="flex-1 flex min-w-0 h-full overflow-hidden bg-white">
          {viewMode === "code" ? (
            <div className="flex w-full h-full min-w-0">
              {/* Left inner column: Files Explorer */}
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

              {/* Right inner column: Monaco Editor + Diagnostics */}
              <div className="flex-1 flex min-w-0 h-full">
                <PreviewPanel
                  files={files}
                  activeFile={activeFile}
                  onCodeChange={handleCodeChange}
                  diagnostics={diagnostics}
                  onAddDiagnostic={handleAddDiagnostic}
                  onClearDiagnostics={handleClearDiagnostics}
                  onAskAiToFix={(err) => handleSendMessage(`Fix this error: ${err}`)}
                  activeTab="code"
                  onTabChange={(t) => setViewMode(t === "preview" ? "preview" : "code")}
                />
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex min-w-0">
              <PreviewPanel
                files={files}
                activeFile={activeFile}
                onCodeChange={handleCodeChange}
                diagnostics={diagnostics}
                onAddDiagnostic={handleAddDiagnostic}
                onClearDiagnostics={handleClearDiagnostics}
                onAskAiToFix={(err) => handleSendMessage(`Fix this error: ${err}`)}
                activeTab="preview"
                onTabChange={(t) => setViewMode(t === "preview" ? "preview" : "code")}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
