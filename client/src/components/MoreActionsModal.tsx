"use client";

import React from "react";
import { Modal } from "@heroui/react";

interface MoreActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

export function MoreActionsModal({
  isOpen,
  onClose,
  onSelectPrompt,
}: MoreActionsModalProps) {
  const categories = [
    {
      title: "Writing & Content",
      items: [
        {
          label: "Draft an engaging newsletter",
          prompt: "Write a high-converting weekly newsletter about product design and AI workflows.",
        },
        {
          label: "Cold outreach email",
          prompt: "Write a concise, personalized cold email to pitch our B2B SaaS product.",
        },
        {
          label: "Blog post outline",
          prompt: "Create an SEO-optimized blog post outline on next-generation web applications.",
        },
      ],
    },
    {
      title: "Coding & Development",
      items: [
        {
          label: "Explain Next.js Server Components",
          prompt: "Explain Next.js React Server Components with practical examples and best practices.",
        },
        {
          label: "Refactor TypeScript code",
          prompt: "How can I refactor this React hook to optimize re-renders and clean up state?",
        },
        {
          label: "Design a REST API Schema",
          prompt: "Help me design an OpenAPI specification for an AI assistant application.",
        },
      ],
    },
    {
      title: "Research & Analysis",
      items: [
        {
          label: "Compare tech stacks",
          prompt: "Compare Next.js vs Vite React apps in terms of performance, SSR, and ecosystem.",
        },
        {
          label: "SWOT Analysis",
          prompt: "Conduct a comprehensive SWOT analysis for an early-stage AI productivity startup.",
        },
      ],
    },
  ];

  return (
    <Modal.Root isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <Modal.Container className="w-full max-w-2xl overflow-hidden p-0">
          <Modal.Dialog>
            <Modal.Header className="flex items-center justify-between px-6 py-4 border-b border-[#F6F6F7]">
              <div>
                <Modal.Heading className="text-base font-semibold text-[#292929]">
                  Explore Prompt Ideas
                </Modal.Heading>
                <p className="text-xs text-[#737373] mt-0.5">
                  Select any template below to kickstart your conversation.
                </p>
              </div>
              <Modal.CloseTrigger
                onClick={onClose}
                className="p-1 rounded-lg text-[#737373] hover:text-[#292929] hover:bg-[#F6F6F7] cursor-pointer transition-colors"
                aria-label="Close modal"
              >
                ✕
              </Modal.CloseTrigger>
            </Modal.Header>

            <Modal.Body className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {categories.map((category) => (
                <div key={category.title}>
                  <h4 className="text-xs font-semibold text-[#737373] uppercase tracking-wider mb-2.5">
                    {category.title}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {category.items.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          onSelectPrompt(item.prompt);
                          onClose();
                        }}
                        className="text-left p-3 rounded-xl bg-[#F6F6F7] hover:bg-[#EAEAEA] border border-transparent hover:border-[#E5E7EB] transition-all cursor-pointer group"
                      >
                        <div className="text-sm font-medium text-[#292929] group-hover:text-black">
                          {item.label}
                        </div>
                        <div className="text-xs text-[#737373] line-clamp-1 mt-0.5">
                          {item.prompt}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
