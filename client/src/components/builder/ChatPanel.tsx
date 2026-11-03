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
  Bookmark,
  Plus,
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
  latestCheckpointTitle?: string;
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
  latestCheckpointTitle,
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
    <section className="flex-1 flex flex-col h-full bg-[#fafafa] border-r border-neutral-200 text-neutral-900 min-w-[340px] max-w-[480px]">
      {/* Messages Thread (White Light Theme) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-center text-emerald-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">What would you like to build?</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">
                Describe your desired website, features, or style changes in plain English.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="w-full space-y-2 pt-2 text-left">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Suggested Prompts
              </span>
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp}
                  onClick={() => onSendMessage(qp)}
                  className="w-full text-left text-xs p-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:text-neutral-900 hover:border-neutral-300 shadow-2xs transition"
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
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "bg-white text-neutral-800 border border-neutral-200/90 shadow-2xs"
                }`}
              >
                {/* Assistant Plan Callout */}
                {msg.plan && (
                  <div className="mb-2.5 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900 space-y-1">
                    <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Plan
                    </div>
                    <p className="whitespace-pre-wrap">{msg.plan}</p>
                  </div>
                )}

                {/* Content */}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Tool Calls */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-neutral-100 space-y-1.5">
                    <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                      <Wrench className="w-3 h-3" />
                      Work steps ({msg.toolCalls.length})
                    </div>
                    {msg.toolCalls.map((tc, stepIndex) => {
                      const isExpanded = expandedTools[tc.id] ?? false;
                      return (
                        <div
                          key={tc.id}
                          className="rounded-lg border border-neutral-200/80 bg-neutral-50/80 text-[11px] overflow-hidden"
                        >
                          <div
                            onClick={() => toggleTool(tc.id)}
                            className="p-2 flex items-center justify-between cursor-pointer hover:bg-neutral-100 transition"
                          >
                            <span className="font-mono text-emerald-700 flex items-center gap-1.5">
                              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              <span className="text-neutral-400">{stepIndex + 1}.</span>
                              {TOOL_LABELS[tc.tool] || tc.tool}
                            </span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                              tc.status === "error"
                                ? "bg-rose-100 text-rose-700"
                                : tc.status === "success"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-neutral-200 text-neutral-700"
                            }`}>
                              {tc.status === "executing" ? "Working" : tc.status === "success" ? "Done" : "Failed"}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="p-2 border-t border-neutral-200/80 bg-white font-mono text-[10px] text-neutral-600 space-y-1 overflow-x-auto">
                              <div>
                                <span className="text-neutral-400">Args:</span>{" "}
                                {JSON.stringify(visibleToolArgs(tc.args))}
                              </div>
                              {tc.error && (
                                <div className="text-rose-600 whitespace-pre-wrap">{tc.error}</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Live Generation Status */}
        {isGenerating && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-700 shadow-2xs animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>{statusMessage || "Generating application..."}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Checkpoint / Version Bookmark Bar (From Image 3) */}
      <div className="px-4 py-2 bg-white border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-700">
        <div className="flex items-center gap-2 truncate">
          <Bookmark className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span className="font-semibold text-neutral-900 truncate">
            {latestCheckpointTitle || "Version 1"}
          </span>
          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            • Auto-saved checkpoint
          </span>
        </div>
        <button
          type="button"
          onClick={onUndoLastCheckpoint}
          disabled={!canUndo || isGenerating}
          title="Rollback to previous checkpoint"
          className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-800 disabled:opacity-40"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Rollback</span>
        </button>
      </div>

      {/* Chat Prompt Input Box (Matches Image 3) */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-neutral-200">
        <div className="rounded-2xl border border-neutral-200 bg-[#fafafa] p-2 focus-within:border-neutral-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-neutral-200/50 transition shadow-2xs">
          <textarea
            ref={textareaRef}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isGenerating
                ? "Generation in progress..."
                : "How can Kivo help you today? (or /command)"
            }
            disabled={isGenerating}
            rows={2}
            className="w-full bg-transparent px-2 py-1 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none resize-none"
          />

          <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Add context"
                className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                <span>Standard</span>
                <ChevronDown className="h-2.5 w-2.5" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={onCancelGeneration}
                  title="Cancel generation"
                  className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputPrompt.trim()}
                  title="Send instruction (Enter)"
                  className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 disabled:hover:bg-blue-600 flex items-center justify-center transition shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
