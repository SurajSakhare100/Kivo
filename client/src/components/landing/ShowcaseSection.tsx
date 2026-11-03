"use client";

import Link from "next/link";
import React from "react";
import {
  ArrowRight,
  FileCode2,
  Globe,
  LayoutGrid,
  Terminal,
} from "lucide-react";
import { useReveal } from "./useReveal";

/* ─────────────────────────────────────────────────────────
   SHOWCASE / DEVELOPER SECTION
   ───────────────────────────────────────────────────────── */
export function ShowcaseSection() {
  const reveal = useReveal(0.1);

  const capabilities = [
    { icon: LayoutGrid, label: "React + TypeScript" },
    { icon: Terminal, label: "WebContainer Runtime" },
    { icon: Globe, label: "Live Hot Reload" },
    { icon: FileCode2, label: "Monaco Code Editor" },
  ];

  return (
    <section id="showcase" className="border-t border-neutral-200/80 bg-neutral-50/50 py-20 sm:py-28">
      <div
        ref={reveal.ref}
        className={`mx-auto max-w-[1240px] px-6 sm:px-10 lg:px-12 transition-all duration-700 ${
          reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: content */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Built for developers
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.025em] text-neutral-900 sm:text-4xl mb-5">
              A real development environment.
              <br />
              <span className="text-neutral-400">Right in your browser.</span>
            </h2>
            <p className="text-base leading-7 text-neutral-600 mb-8">
              Kivo runs a full Node.js environment in your browser using WebContainers.
              Your code compiles, dependencies install, and your app runs with true Vite HMR — just like local development, but with zero setup.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {capabilities.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-2xs"
                >
                  <Icon className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-[13px] font-medium text-neutral-800">{label}</span>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 text-[14px] font-medium text-neutral-900 hover:text-emerald-600 transition-colors group"
            >
              Explore the builder workspace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right: Modern Terminal window */}
          <div className="relative">
            <div className="rounded-2xl border border-neutral-800 bg-[#0d0d11] overflow-hidden shadow-2xl shadow-neutral-900/10">
              {/* Terminal header */}
              <div className="flex items-center justify-between border-b border-neutral-800/80 px-4 py-3 bg-[#111116]">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                  <span className="text-[11px] text-neutral-400 font-mono ml-2">webcontainer.term</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Running
                </span>
              </div>

              {/* Terminal content */}
              <div className="p-5 font-mono text-[12px] leading-6 text-neutral-300 min-h-[250px]">
                <div>
                  <span className="text-emerald-400 font-bold">$</span> npm create vite@latest my-app
                </div>
                <div className="text-neutral-500">✔ Select a framework: React</div>
                <div className="text-neutral-500">✔ Select a variant: TypeScript</div>
                <div className="mt-2">
                  <span className="text-emerald-400 font-bold">$</span> cd my-app && npm install
                </div>
                <div className="text-neutral-500">added 217 packages in 2.8s</div>
                <div className="mt-2">
                  <span className="text-emerald-400 font-bold">$</span> npm run dev
                </div>
                <div className="mt-1 text-emerald-300">  VITE v6.2.0  ready in 280ms</div>
                <div className="mt-1">
                  <span className="text-neutral-500">  ➜  Local:   </span>
                  <span className="text-blue-400 underline">http://localhost:5173/</span>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  <span className="text-emerald-400 font-bold">$</span>
                  <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

