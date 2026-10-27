"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Eye,
  Code2,
  RefreshCw,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Terminal,
  Save,
  Check,
  Wand2,
} from "lucide-react";
import { FilesMap, ViewportMode, PanelTab, DiagnosticItem } from "@/types/builder";
import { generatePreviewHtml } from "@/lib/runtime/bundler";

// Dynamically import Monaco Editor to avoid SSR errors
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-neutral-500 text-xs">
      <Loader2 className="w-4 h-4 animate-spin mr-2" />
      Loading Editor...
    </div>
  ),
});

interface PreviewPanelProps {
  files: FilesMap;
  activeFile: string;
  onCodeChange: (path: string, newContent: string) => void;
  diagnostics: DiagnosticItem[];
  onAddDiagnostic: (item: DiagnosticItem) => void;
  onClearDiagnostics: () => void;
  onAskAiToFix: (diagnosticMsg: string) => void;
}

export function PreviewPanel({
  files,
  activeFile,
  onCodeChange,
  diagnostics,
  onAddDiagnostic,
  onClearDiagnostics,
  onAskAiToFix,
}: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("preview");
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Compile sandboxed preview HTML from files
  const previewHtml = useMemo(() => {
    return generatePreviewHtml(files);
  }, [files]);

  // Listen to messages from the sandboxed iframe for diagnostics
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;

      if (event.data.type === "KIVO_DIAGNOSTIC") {
        onAddDiagnostic(event.data.diagnostic);
      } else if (event.data.type === "KIVO_DIAGNOSTIC_CLEAN") {
        onClearDiagnostics();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onAddDiagnostic, onClearDiagnostics]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = previewHtml;
    }
  };

  const handleOpenNewWindow = () => {
    try {
      sessionStorage.setItem("kivo_preview_files", JSON.stringify(files));
      localStorage.setItem("kivo_preview_files", JSON.stringify(files));
    } catch (e) {
      console.warn("Storage sync error:", e);
    }
    window.open("/preview", "_blank");
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setSaveStatus("saving");
    onCodeChange(activeFile, value);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    }, 400);
  };

  const handleDownloadFile = () => {
    const content = files[activeFile] || "";
    const fileName = activeFile.split("/").pop() || "file.txt";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Determine Monaco language mode from file extension
  const getLanguage = (path: string) => {
    if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
    if (path.endsWith(".jsx") || path.endsWith(".js")) return "javascript";
    if (path.endsWith(".css")) return "css";
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".html")) return "html";
    return "plaintext";
  };

  const errorCount = diagnostics.filter((d) => d.type === "error").length;

  return (
    <section className="flex-1 flex flex-col h-full bg-[#0d0d12] overflow-hidden">
      {/* Top Controls Toolbar */}
      <div className="h-12 border-b border-neutral-800 px-4 flex items-center justify-between bg-neutral-950/60 shrink-0">
        {/* Left Tabs */}
        <div className="flex items-center gap-1 bg-neutral-900/80 p-0.5 rounded-lg border border-neutral-800">
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === "preview"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === "code"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Code
          </button>
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === "diagnostics"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Diagnostics
            {errorCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold flex items-center justify-center">
                {errorCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {activeTab === "preview" && (
            <>
              {/* Responsive Viewport Switcher */}
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
                <button
                  onClick={() => setViewport("desktop")}
                  title="Desktop (100%)"
                  className={`p-1.5 rounded transition ${
                    viewport === "desktop"
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewport("tablet")}
                  title="Tablet (768px)"
                  className={`p-1.5 rounded transition ${
                    viewport === "tablet"
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewport("mobile")}
                  title="Mobile (375px)"
                  className={`p-1.5 rounded transition ${
                    viewport === "mobile"
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                title="Refresh preview"
                className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {/* Open in New Window */}
              <button
                onClick={handleOpenNewWindow}
                title="Open in new window"
                className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {activeTab === "code" && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-400">{activeFile}</span>
              {saveStatus === "saving" && (
                <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
              <button
                onClick={handleDownloadFile}
                title="Download current file"
                className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden bg-[#070709] flex flex-col">
        {/* Error Notification Banner if diagnostics found in preview */}
        {errorCount > 0 && activeTab === "preview" && (
          <div className="bg-rose-950/70 border-b border-rose-800/80 px-4 py-2 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2 truncate pr-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="truncate">
                {diagnostics[0]?.message || "Compiler or runtime issues detected."}
              </span>
            </div>
            <button
              onClick={() => onAskAiToFix(diagnostics[0]?.message || "Fix preview errors")}
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500 text-black font-semibold text-[11px] hover:bg-rose-400 transition"
            >
              <Wand2 className="w-3 h-3" />
              Ask AI to Fix
            </button>
          </div>
        )}

        {/* Tab 1: Live Sandboxed Iframe Preview */}
        {activeTab === "preview" && (
          <div className="flex-1 flex items-center justify-center p-4 bg-[#0a0a0f] overflow-auto">
            <div
              className={`h-full max-w-full bg-neutral-950 rounded-xl overflow-hidden shadow-2xl border border-neutral-800/80 transition-all duration-300 ${
                viewport === "desktop"
                  ? "w-full"
                  : viewport === "tablet"
                  ? "w-[768px]"
                  : "w-[375px]"
              }`}
            >
              <iframe
                ref={iframeRef}
                srcDoc={previewHtml}
                title="Kivo Live App Preview"
                sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
                className="w-full h-full border-none bg-[#09090b]"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Monaco Editor */}
        {activeTab === "code" && (
          <div className="flex-1 w-full h-full">
            <MonacoEditor
              height="100%"
              path={activeFile}
              language={getLanguage(activeFile)}
              value={files[activeFile] || ""}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, monospace",
                minimap: { enabled: false },
                wordWrap: "on",
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                renderWhitespace: "none",
                tabSize: 2,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>
        )}

        {/* Tab 3: Diagnostics Panel */}
        {activeTab === "diagnostics" && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-neutral-400 text-xs">
                {diagnostics.length} diagnostic items reported
              </span>
              {diagnostics.length > 0 && (
                <button
                  onClick={onClearDiagnostics}
                  className="text-neutral-500 hover:text-neutral-300 text-[10px]"
                >
                  Clear all
                </button>
              )}
            </div>

            {diagnostics.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
                <span>All diagnostics clean. No runtime or bundler errors detected.</span>
              </div>
            ) : (
              diagnostics.map((diag) => (
                <div
                  key={diag.id}
                  className={`p-3 rounded-lg border ${
                    diag.type === "error"
                      ? "bg-rose-950/20 border-rose-800/60 text-rose-300"
                      : "bg-amber-950/20 border-amber-800/60 text-amber-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="uppercase text-[9px] font-bold tracking-wider px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800">
                      {diag.type} • {diag.source || "runtime"}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {new Date(diag.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs break-all">{diag.message}</div>
                  {diag.file && (
                    <div className="mt-1 text-[10px] text-neutral-400">
                      File: {diag.file} {diag.line ? `:${diag.line}` : ""}
                    </div>
                  )}
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => onAskAiToFix(diag.message)}
                      className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded hover:bg-rose-500/30 transition flex items-center gap-1 font-sans"
                    >
                      <Wand2 className="w-3 h-3" />
                      Fix with AI
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
