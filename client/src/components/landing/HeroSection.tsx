"use client";

import Link from "next/link";
import React, { useState } from "react";
import { ArrowRight, Command } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   HERO SECTION
   ───────────────────────────────────────────────────────── */
export function HeroSection() {
  const [prompt, setPrompt] = useState("");
  const builderHref = prompt.trim()
    ? `/dashboard?prompt=${encodeURIComponent(prompt.trim())}`
    : "/dashboard";

  const suggestions = [
    "A portfolio for a product designer",
    "A SaaS dashboard with analytics",
    "A landing page for a coffee brand",
    "An AI prompt engineering workspace",
  ];

  return (
    <section className="relative pt-32 pb-24 sm:pt-36 sm:pb-32 overflow-hidden bg-white">
      {/* Asset Image Background: width matches web width */}
      <div
        className="absolute top-0 left-0 w-full h-[800px] bg-cover bg-top bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: "url('/assets/image.png')" }}
      />
      {/* Very, very light white overlay on hero image */}
      <div className="absolute top-0 left-0 w-full h-[800px] bg-white/[0.18] pointer-events-none z-0" />

      <div className="relative mx-auto max-w-[1240px] px-6 sm:px-10 lg:px-12">
        {/* Badge */}
        <div className="animate-reveal-up mb-7 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-1.5 text-xs font-medium text-neutral-700 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Real-time AI React & Vite code generator
          </div>
        </div>

        {/* Headline */}
        <div className="text-center">
          <h1 className="animate-reveal-up stagger-1 mx-auto max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-neutral-900 sm:text-5xl md:text-6xl lg:text-[66px]">
            Describe your app.
            <br />
            <span className="text-neutral-400">Watch it come to life.</span>
          </h1>
          <p className="animate-reveal-up stagger-2 mx-auto mt-6 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
            Kivo turns natural language into production-ready React applications — complete with live preview, Monaco editor, and instant hot-reload.
          </p>
        </div>

        {/* Prompt input box */}
        <div className="animate-reveal-up stagger-3 mx-auto mt-10 max-w-2xl">
          <form
            className="group rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl shadow-neutral-900/5 transition-all duration-200 focus-within:border-neutral-400 focus-within:ring-3 focus-within:ring-neutral-200/50"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = builderHref;
            }}
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  window.location.href = builderHref;
                }
              }}
              placeholder="Ask Kivo to create a dashboard, portfolio, or landing page..."
              rows={2}
              className="min-h-[58px] w-full resize-none bg-transparent px-4 py-2.5 text-sm leading-6 text-neutral-900 outline-none placeholder:text-neutral-400"
              aria-label="Describe the app you want to build"
            />
            <div className="flex items-center justify-between border-t border-neutral-100 px-3 pt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
                <Command className="h-3 w-3" />
                <span>Press Enter to generate</span>
              </div>
              <Link
                href={builderHref}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-neutral-900 px-4 text-[13px] font-medium text-white transition hover:bg-neutral-800 shadow-xs active:scale-98"
              >
                Build
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </form>

          {/* Suggestion pills */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPrompt(s)}
                className="rounded-full border border-neutral-200/80 bg-neutral-50 px-3.5 py-1.5 text-[11px] font-medium text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

