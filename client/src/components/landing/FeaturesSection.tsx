"use client";

import React from "react";
import {
  Code2,
  Eye,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Wand2,
} from "lucide-react";
import { useReveal } from "./useReveal";

/* ─────────────────────────────────────────────────────────
   FEATURES SECTION
   ───────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Wand2,
    title: "AI-Powered Generation",
    description:
      "Describe what you want in plain English. Kivo's AI plans the architecture, generates clean React + TypeScript code, and delivers a working application.",
    tag: "Core",
  },
  {
    icon: Eye,
    title: "Live Preview",
    description:
      "See your app running in a real browser environment instantly. Every change appears in real-time — no build steps, no waiting.",
    tag: "Preview",
  },
  {
    icon: Code2,
    title: "Full Code Editor",
    description:
      "Built-in Monaco editor with syntax highlighting, IntelliSense, and full file tree. You own every line of code.",
    tag: "Editor",
  },
  {
    icon: RefreshCw,
    title: "Iterative Refinement",
    description:
      "Chat with the AI to iterate on your design and functionality. Each message intelligently modifies the existing codebase.",
    tag: "Iterate",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Sandboxed",
    description:
      "All code runs in an isolated WebContainer sandbox. Generated output is sanitized and validated before preview.",
    tag: "Security",
  },
  {
    icon: Layers3,
    title: "Project Management",
    description:
      "Save multiple projects, create checkpoints, restore previous versions. Your work is always safe in IndexedDB.",
    tag: "Projects",
  },
];

export function FeaturesSection() {
  const reveal = useReveal(0.1);

  return (
    <section id="features" className="bg-neutral-50/50 py-20 sm:py-28">
      <div
        ref={reveal.ref}
        className={`mx-auto max-w-[1240px] px-6 sm:px-10 lg:px-12 transition-all duration-700 ${
          reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Section header */}
        <div className="mb-14 max-w-xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Features
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.025em] text-neutral-900 sm:text-4xl">
            Everything you need to build, preview, and ship.
          </h2>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            A complete development environment powered by AI. No setup, no configuration — just describe and build.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, tag }) => (
            <article
              key={title}
              className="group relative rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs transition-all duration-200 hover:border-neutral-300 hover:shadow-md"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 transition-colors group-hover:border-emerald-500/40 group-hover:bg-emerald-50 group-hover:text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  {tag}
                </span>
              </div>
              <h3 className="text-[16px] font-semibold text-neutral-900 mb-2">{title}</h3>
              <p className="text-[13px] leading-6 text-neutral-600">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

