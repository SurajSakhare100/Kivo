"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  RefreshCw,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  AlertTriangle,
  Download,
  Loader2,
  Terminal,
  Check,
  Wand2,
  ChevronDown,
  FileText,
  Zap,
} from "lucide-react";
import { FilesMap, ViewportMode, PanelTab, DiagnosticItem } from "@/types/builder";
import { generatePreviewHtml } from "@/lib/runtime/bundler";

// Dynamically import Monaco Editor to avoid SSR errors
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-white text-neutral-400 text-xs">
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
  activeTab?: PanelTab;
  onTabChange?: (tab: PanelTab) => void;
  viewport?: ViewportMode;
  onViewportChange?: (v: ViewportMode) => void;
}

export function PreviewPanel({
  files,
  activeFile,
  onCodeChange,
  diagnostics,
  onAddDiagnostic,
  onClearDiagnostics,
  onAskAiToFix,
  activeTab: externalActiveTab,
  onTabChange,
  viewport: externalViewport,
  onViewportChange,
}: PreviewPanelProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<PanelTab>("preview");
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = onTabChange || setInternalActiveTab;

  const [internalViewport, setInternalViewport] = useState<ViewportMode>("desktop");
  const viewport = externalViewport || internalViewport;
  const setViewport = onViewportChange || setInternalViewport;

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(true);
  const [terminalTab, setTerminalTab] = useState<"kivo" | "publish" | "terminal">("terminal");
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
    }, 500);
  };

  const handleDownloadFile = () => {
    const content = files[activeFile];
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.split("/").pop() || "code.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLanguage = (path: string): string => {
    if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
    if (path.endsWith(".jsx") || path.endsWith(".js")) return "javascript";
    if (path.endsWith(".css")) return "css";
    if (path.endsWith(".html")) return "html";
    if (path.endsWith(".json")) return "json";
    return "plaintext";
  };

  const errorCount = diagnostics.filter((d) => d.type === "error").length;

  return (
    <section className="flex-1 flex flex-col h-full bg-white text-neutral-900 min-w-0">
      {/* Sub Header Toolbar only when in Code mode */}
      {activeTab === "code" && (
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-600 bg-neutral-100/70 border border-neutral-200/80 px-2.5 py-1 rounded-lg">
            <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            {activeFile.split("/").map((segment, idx, arr) => (
              <React.Fragment key={idx}>
                <span className={idx === arr.length - 1 ? "font-semibold text-neutral-900" : "text-neutral-500"}>
                  {segment}
                </span>
                {idx < arr.length - 1 && <span className="text-neutral-300">&gt;</span>}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {saveStatus === "saving" && (
              <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
            <button
              onClick={handleDownloadFile}
              title="Download current file"
              className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden bg-neutral-100 flex flex-col min-h-0">
        {/* Error Notification Banner if diagnostics found in preview */}
        {errorCount > 0 && activeTab === "preview" && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2 truncate pr-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="truncate">
                {diagnostics[0]?.message || "Compiler or runtime issues detected."}
              </span>
            </div>
            <button
              onClick={() => onAskAiToFix(diagnostics[0]?.message || "Fix preview errors")}
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-700 transition"
            >
              <Wand2 className="w-3 h-3" />
              Ask AI to Fix
            </button>
          </div>
        )}

        {/* Tab 1: Live Sandboxed Iframe Preview */}
        {activeTab === "preview" && (
          <div className="flex-1 flex items-center justify-center p-4 bg-neutral-100 overflow-auto">
            <div
              className={`h-full max-w-full bg-white rounded-xl overflow-hidden shadow-md border border-neutral-200 transition-all duration-300 ${
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
                className="w-full h-full border-none bg-white"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Monaco Editor + Bottom Dock (100% Light Theme - Matches Images) */}
        {activeTab === "code" && (
          <div className="flex-1 flex flex-col h-full w-full bg-white min-h-0 overflow-hidden">
            {/* Monaco Editor Container */}
            <div className="flex-1 w-full min-h-0 bg-white">
              <MonacoEditor
                height="100%"
                path={activeFile}
                language={getLanguage(activeFile)}
                value={files[activeFile] || ""}
                onChange={handleEditorChange}
                theme="vs"
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

            {/* Bottom Dock (Terminal / Output) in Crisp Light Theme */}
            <div className="border-t border-neutral-200 bg-[#fafafa] shrink-0">
              {/* Dock Tabs Header */}
              <div className="flex items-center justify-between px-3 h-8 border-b border-neutral-200 bg-white text-xs select-none">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setTerminalTab("kivo"); setIsTerminalOpen(true); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      terminalTab === "kivo" && isTerminalOpen
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>Kivo</span>
                  </button>

                  <button
                    onClick={() => { setTerminalTab("publish"); setIsTerminalOpen(true); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      terminalTab === "publish" && isTerminalOpen
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <ExternalLink className="w-3 h-3 text-blue-500" />
                    <span>Publish Output</span>
                  </button>

                  <button
                    onClick={() => { setTerminalTab("terminal"); setIsTerminalOpen(true); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      terminalTab === "terminal" && isTerminalOpen
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <Terminal className="w-3 h-3 text-emerald-600" />
                    <span>Terminal</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsTerminalOpen((prev) => !prev)}
                  className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
                  title={isTerminalOpen ? "Collapse dock" : "Expand dock"}
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isTerminalOpen ? "" : "rotate-180"
                    }`}
                  />
                </button>
              </div>

              {/* Terminal Logs in Light Theme */}
              {isTerminalOpen && (
                <div className="p-3 h-28 overflow-y-auto font-mono text-[11px] leading-relaxed bg-[#fafafa] text-neutral-700 select-text">
                  {terminalTab === "terminal" && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">➜</span>
                        <span className="font-semibold text-neutral-800">Local:</span>
                        <span className="text-blue-600 underline">http://localhost:5173/</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">➜</span>
                        <span className="font-semibold text-neutral-800">Network:</span>
                        <span className="text-neutral-500">use --host to expose</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-400">
                        <span className="text-emerald-600 font-bold">➜</span>
                        <span>press <kbd className="px-1 py-0.5 rounded bg-neutral-200/70 font-semibold text-neutral-700">h</kbd> + <kbd className="px-1 py-0.5 rounded bg-neutral-200/70 font-semibold text-neutral-700">enter</kbd> to show help</span>
                      </div>
                    </div>
                  )}

                  {terminalTab === "kivo" && (
                    <div className="text-xs text-neutral-600 space-y-1">
                      <p className="font-semibold text-neutral-900">⚡ Kivo In-Memory Bundler active</p>
                      <p className="text-neutral-500 text-[11px]">Dynamic Babel JSX compilation and Tailwind CSS CDN styles loaded.</p>
                    </div>
                  )}

                  {terminalTab === "publish" && (
                    <div className="text-xs text-neutral-600 space-y-1">
                      <p className="font-semibold text-neutral-900">🚀 Production Ready</p>
                      <p className="text-neutral-500 text-[11px]">Click &quot;Publish&quot; in the header to export code or share your live deployment.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
