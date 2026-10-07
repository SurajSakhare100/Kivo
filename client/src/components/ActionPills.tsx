"use client";

import React from "react";

interface ActionPillsProps {
  onSelectAction: (prompt: string) => void;
  onOpenMore: () => void;
}

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

export function ActionPills({ onSelectAction, onOpenMore }: ActionPillsProps) {
  const actions: ActionItem[] = [
    {
      id: "write",
      label: "Help me write",
      prompt: "Help me write an outline for an executive pitch deck",
      icon: (
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      ),
    },
    {
      id: "learn",
      label: "Learn about",
      prompt: "Explain quantum computing in simple terms for a beginner",
      icon: (
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
    {
      id: "analyze",
      label: "Analyze image",
      prompt: "Can you analyze the composition and typography in this screenshot?",
      icon: (
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      id: "summarize",
      label: "Summarize text",
      prompt: "Please provide a concise summary with key bullet points of the following text:",
      icon: (
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="15" y1="12" x2="3" y2="12" />
          <line x1="17" y1="18" x2="3" y2="18" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4 max-w-[760px] mx-auto px-2">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => onSelectAction(action.prompt)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-[13px] font-medium text-[#292929] bg-[#F6F6F7] hover:bg-[#ececee] active:scale-97 border border-transparent hover:border-[#E5E7EB] rounded-full transition-all duration-150 cursor-pointer shadow-2xs"
        >
          <span className="text-[#292929] opacity-80">{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}

      {/* More Button */}
      <button
        type="button"
        onClick={onOpenMore}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-[13px] font-medium text-[#292929] bg-[#F6F6F7] hover:bg-[#ececee] active:scale-97 border border-transparent hover:border-[#E5E7EB] rounded-full transition-all duration-150 cursor-pointer shadow-2xs"
      >
        <svg
          className="w-3.5 h-3.5 text-[#292929] opacity-80"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2.2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>More</span>
      </button>
    </div>
  );
}
