"use client";

import React from "react";
import { MessageSquare, Play, Sparkles } from "lucide-react";
import { useReveal } from "./useReveal";

/* ─────────────────────────────────────────────────────────
   HOW IT WORKS
   ───────────────────────────────────────────────────────── */
const STEPS = [
  {
    number: "01",
    title: "Describe",
    description:
      "Tell Kivo what you want to build in natural language. Be as specific or as open-ended as you like — the AI adapts to your level of detail.",
    icon: MessageSquare,
    detail: "AI understands context, design preferences, and technical requirements from your description.",
  },
  {
    number: "02",
    title: "Generate",
    description:
      "Kivo plans the architecture, creates components, writes styles, and assembles a complete React application in seconds.",
    icon: Sparkles,
    detail: "Watch the generation process in real-time with step-by-step progress indicators.",
  },
  {
    number: "03",
    title: "Refine & Ship",
    description:
      "Preview your app live, edit code directly in Monaco, or chat with AI to iterate. When you're happy, export the full source code.",
    icon: Play,
    detail: "Your code is yours — clean, well-structured, and ready for production deployment.",
  },
];

export function HowItWorksSection() {
  const reveal = useReveal(0.1);

  return (
    <section id="how-it-works" className="border-t border-neutral-200/80 bg-white py-20 sm:py-28">
      <div
        ref={reveal.ref}
        className={`mx-auto max-w-[1240px] px-6 sm:px-10 lg:px-12 transition-all duration-700 ${
          reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="mb-14 text-center max-w-xl mx-auto">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
            How it works
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.025em] text-neutral-900 sm:text-4xl">
            Three steps. Zero friction.
          </h2>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            From idea to working application in under a minute.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {STEPS.map(({ number, title, description, icon: Icon, detail }) => (
            <div key={number} className="relative">
              <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-6 h-full transition hover:bg-white hover:shadow-md hover:border-neutral-300">
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/70">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-semibold text-neutral-400">{number}</span>
                    <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
                  </div>
                </div>
                <p className="text-[13px] leading-6 text-neutral-600 mb-4">{description}</p>
                <p className="text-[12px] leading-5 text-neutral-500 border-t border-neutral-200/80 pt-4">
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

