"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Sparkles,
  AlertCircle,
  FileCode,
  Wrench,
  RotateCcw,
  Square,
  User,
  Zap,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ChatMessage, ChatStatus, ToolCallRecord } from "@/types/builder";

interface ChatPanelProps {
  messages: ChatMessage[];
  status: ChatStatus;
  statusMessage?: string;
  isGenerating: boolean;
  useMockMode: boolean;
  onToggleMockMode: (val: boolean) => void;
  onSendMessage: (prompt: string) => void;
  onCancelGeneration: () => void;
  onUndoLastCheckpoint: () => void;
  canUndo: boolean;
}

const QUICK_PROMPTS = [
  "Add an analytics dashboard with KPI cards and charts",
  "Build a dark developer portfolio with project filters",
  "Create a modern SaaS pricing table with monthly/yearly toggle",
  "Add a responsive navigation bar and contact modal",
];

const TOOL_LABELS: Record<string, string> = {
  list_files: "Inspect project files",
  read_file: "Read file",
  search: "Search project",
  search_files: "Search project",
  web_search: "Research documentation",
  web_search_ddg: "Research documentation",
  create_file: "Create file",
  update_file: "Edit file",
  delete_file: "Delete file",
  add_package: "Add dependency",
  get_diagnostics: "Check diagnostics",
};

function visibleToolArgs(args: Record<string, unknown>) {
  const { content, ...safeArgs } = args;
  return content === undefined ? safeArgs : { ...safeArgs, content: "[file contents applied]" };
}

export function ChatPanel({
  messages,
  status,
  statusMessage,
  isGenerating,
  useMockMode,
  onToggleMockMode,
  onSendMessage,
  onCancelGeneration,
  onUndoLastCheckpoint,
  canUndo,
}: ChatPanelProps) {
  const [inputPrompt, setInputPrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status, statusMessage]);

  const toggleTool = (toolId: string) => {
    setExpandedTools((prev) => ({ ...prev, [toolId]: !prev[toolId] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPrompt.trim() && !isGenerating) {
      onSendMessage(inputPrompt.trim());
      setInputPrompt("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <section className="flex-1 flex flex-col h-full bg-[#0a0a0d] border-r border-neutral-800 min-w-[340px] max-w-[480px]">
      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">What would you like to build?</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">
                Describe your desired website, features, or style changes in plain English.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="w-full space-y-2 pt-2 text-left">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                Suggested Prompts
              </span>
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp}
                  onClick={() => onSendMessage(qp)}
                  className="w-full text-left text-xs p-2.5 rounded-lg border border-neutral-800/80 bg-neutral-900/40 text-neutral-300 hover:text-white hover:border-neutral-700 transition"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-neutral-800 text-white border border-neutral-700/60"
                    : "bg-neutral-900/80 text-neutral-200 border border-neutral-800"
                }`}
              >
                {/* Assistant Plan Callout */}
                {msg.plan && (
                  <div className="mb-2 p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                    <div className="font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      Plan
                    </div>
                    <p className="whitespace-pre-wrap">{msg.plan}</p>
                  </div>
                )}

                {/* Content */}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Tool Calls */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-neutral-800 space-y-1.5">
                    <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                      <Wrench className="w-3 h-3" />
                      Work steps ({msg.toolCalls.length})
                    </div>
                    {msg.toolCalls.map((tc, stepIndex) => {
                      const isExpanded = expandedTools[tc.id] ?? true;
                      return (
                        <div
                          key={tc.id}
                          className="rounded-lg border border-neutral-800/80 bg-neutral-950/60 text-[11px] overflow-hidden"
                        >
                          <div
                            onClick={() => toggleTool(tc.id)}
                            className="p-2 flex items-center justify-between cursor-pointer hover:bg-neutral-900/50 transition"
                          >
                            <span className="font-mono text-emerald-400 flex items-center gap-1.5">
                              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              <span className="text-neutral-500">{stepIndex + 1}.</span>
                              {TOOL_LABELS[tc.tool] || tc.tool}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                              tc.status === "error"
                                ? "bg-rose-500/10 text-rose-300"
                                : tc.status === "success"
                                  ? "bg-emerald-500/10 text-emerald-300"
                                  : "bg-neutral-800 text-neutral-300"
                            }`}>
                              {tc.status === "executing" ? "Working" : tc.status === "success" ? "Done" : "Failed"}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="p-2 border-t border-neutral-800/80 bg-neutral-950 font-mono text-[10px] text-neutral-400 space-y-1 overflow-x-auto">
                              <div>
                                <span className="text-neutral-500">Args:</span>{" "}
                                {JSON.stringify(visibleToolArgs(tc.args))}
                              </div>
                              {tc.error && (
                                <div className="text-rose-300 whitespace-pre-wrap">{tc.error}</div>
                              )}
                              {tc.result !== undefined && (
                                <div>
                                  <span className="text-neutral-500">Result:</span>{" "}
                                  {typeof tc.result === "string" ? tc.result : JSON.stringify(tc.result)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Meta tokens & time */}
                {(msg.tokensUsed !== undefined || msg.generationTime !== undefined) && (
                  <div className="mt-2 text-[9px] text-neutral-500 flex items-center gap-2">
                    {msg.tokensUsed !== undefined && <span>{msg.tokensUsed} tokens</span>}
                    {msg.generationTime !== undefined && <span>• {msg.generationTime}s</span>}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Live In-Progress Status Banner */}
        {isGenerating && statusMessage && (
          <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 text-xs text-neutral-300 flex items-center gap-2.5 animate-pulse">
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
            <span className="truncate">{statusMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-800 bg-neutral-950">
        <div className="relative rounded-xl border border-neutral-800 bg-neutral-900/60 focus-within:border-neutral-600 transition">
          <textarea
            ref={textareaRef}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isGenerating
                ? "Generation in progress..."
                : "Describe changes (e.g., 'Add a pricing calculator', 'Make it dark themed')..."
            }
            disabled={isGenerating}
            rows={2}
            className="w-full bg-transparent p-3 pr-20 text-xs text-white placeholder-neutral-500 focus:outline-none resize-none"
          />

          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button
              type="button"
              onClick={onUndoLastCheckpoint}
              disabled={!canUndo || isGenerating}
              title="Undo last modification"
              aria-label="Undo last modification"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-800 text-neutral-400 transition hover:bg-neutral-800 hover:text-white disabled:opacity-30"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            {isGenerating ? (
              <button
                type="button"
                onClick={onCancelGeneration}
                title="Cancel generation"
                className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 flex items-center justify-center transition"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputPrompt.trim()}
                title="Send instruction (Enter)"
                className="w-7 h-7 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 flex items-center justify-center transition font-semibold"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-neutral-500">
          <span>Enter to send, Shift+Enter for newline</span>
          <button
            type="button"
            onClick={() => onToggleMockMode(!useMockMode)}
            title={useMockMode ? "Switch to cloud mode" : "Switch to offline mode"}
            aria-label={useMockMode ? "Switch to cloud mode" : "Switch to offline mode"}
            className={`rounded p-1 transition hover:bg-neutral-800 ${useMockMode ? "text-neutral-400" : "text-emerald-400"}`}
          >
            <Zap className="h-3 w-3" />
          </button>
        </div>
      </form>
    </section>
  );
}
