"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dropdown } from "@heroui/react";
import { AIModel } from "@/types/chat";

interface PromptCardProps {
  onSendMessage: (text: string, model: AIModel) => void;
  isLoading?: boolean;
  initialPrompt?: string;
}

export function PromptCard({
  onSendMessage,
  isLoading = false,
  initialPrompt = "",
}: PromptCardProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>("Kivo AI Engine");
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync initial prompt when clicked from quick actions
  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialPrompt]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [prompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanPrompt = prompt.trim();

    // The current callback only accepts text, so don't advertise an
    // attachment-only send action until the parent supports file data.
    if (!cleanPrompt || isLoading) return;

    onSendMessage(cleanPrompt, selectedModel);
    setPrompt("");
    setAttachedFiles([]);

    // Allow selecting the same file again after submitting/removing it.
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const names = Array.from(e.target.files).map((file) => file.name);
      setAttachedFiles((prev) => [...prev, ...names]);

      // Reset the input so selecting the exact same file again fires onChange.
      e.target.value = "";
    }
  };

  const toggleRecording = () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);

    recordingTimeoutRef.current = setTimeout(() => {
      setPrompt(
        (prev) =>
          (prev ? `${prev} ` : "") +
          "Summarize the latest trends in artificial intelligence."
      );
      setIsRecording(false);
      recordingTimeoutRef.current = null;
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  const models: AIModel[] = ["Kivo AI Engine"];

  return (
    <div className="w-full max-w-[760px] mx-auto">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white border border-[#E5E7EB] rounded-[26px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-[#D1D5DB] focus-within:border-[#292929] transition-all duration-200"
      >
        {/* Attached file badges */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-1">
            {attachedFiles.map((file, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[#F6F6F7] text-[#292929] rounded-lg border border-[#E5E7EB]"
              >
                <span>📎 {file}</span>
                <button
                  type="button"
                  onClick={() =>
                    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="hover:text-red-500 font-bold ml-1"
                  aria-label={`Remove ${file}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          disabled={isLoading}
          className="w-full bg-transparent text-[#292929] placeholder:text-[#9CA3AF] text-[16px] leading-relaxed resize-none focus:outline-hidden px-1 pt-1 pb-4 max-h-48"
        />

        {/* Bottom controls bar */}
        <div className="flex items-center justify-between pt-2">
          {/* Left: Attachment button */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Attach files or images"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#292929] hover:bg-[#F6F6F7] transition-colors cursor-pointer"
              aria-label="Attach file"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          {/* Right: Model Picker, Mic, and Send */}
          <div className="flex items-center gap-3">
            {/* Auto / Model Selector */}
            <Dropdown.Root
              isOpen={isModelMenuOpen}
              onOpenChange={setIsModelMenuOpen}
            >
              <Dropdown.Trigger>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium text-[#292929] hover:bg-[#F6F6F7] rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-haspopup="menu"
                  aria-expanded={isModelMenuOpen}
                >
                  {/* Sun / Sparkle Icon */}
                  <svg
                    className="w-4 h-4 text-[#292929]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                  </svg>
                  <span>{selectedModel}</span>
                  <svg
                    className="w-3.5 h-3.5 text-[#737373]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </Dropdown.Trigger>
              <Dropdown.Popover className="bg-page border border-card  min-w-[170px] z-50">
                <Dropdown.Menu
                  aria-label="Select AI Model"
                  selectionMode="single"
                  selectedKeys={new Set([selectedModel])}
                  className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg p-1 min-w-[160px]"
                  onAction={(key) => {
                    setSelectedModel(key as AIModel);
                    setIsModelMenuOpen(true);
                  }}
                >
                  {models.map((model) => (
                    <Dropdown.Item
                      id={model}
                      key={model}
                      className={`px-3 py-2 text-sm rounded-lg cursor-pointer ${selectedModel === model
                        ? "bg-[#F6F6F7] font-semibold text-[#292929]"
                        : "text-[#4B5563] hover:bg-[#F6F6F7]"
                        }`}
                    >
                      {model}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>

            </Dropdown.Root>

            {/* Mic Button */}
            <div
              onClick={toggleRecording}
              title={isRecording ? "Listening..." : "Voice input"}
              aria-pressed={isRecording}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isRecording
                ? "bg-red-50 text-red-500 animate-pulse"
                : "text-[#292929] hover:bg-[#F6F6F7]"
                }`}
              aria-label="Voice input"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>

            {/* Send Button (Circle with upward arrow) */}
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              title="Send message"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${prompt.trim().length > 0 && !isLoading
                ? "bg-[#292929] text-white hover:bg-[#1a1a1a] shadow-xs active:scale-95"
                : "bg-[#F6F6F7] text-[#9CA3AF] cursor-not-allowed opacity-80"
                }`}
              aria-label="Submit prompt"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
