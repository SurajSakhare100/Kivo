"use client";

import React from "react";
import {
  ArrowRight,
  ChevronDown,
  Compass,
  LayoutGrid,
  Lock,
  Mic,
  PenSquare,
  Plus,
  Search,
  Share2,
  Sparkles,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   PRODUCT MOCKUP (Crafted exactly from user's uploaded image)
   ───────────────────────────────────────────────────────── */
export function ProductMockup({ userName = "suraj" }: { userName?: string }) {
  return (
    <div className="relative">
      {/* Soft drop shadow frame */}
      <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-neutral-200/90 bg-white shadow-2xl shadow-neutral-900/10">
        {/* Window title bar */}
        <div className="flex h-11 items-center justify-between border-b border-neutral-200/70 bg-neutral-50/80 px-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-white border border-neutral-200/80 px-3 py-1 shadow-2xs">
            <Lock className="h-2.5 w-2.5 text-neutral-400" />
            <span className="text-[11px] font-medium text-neutral-600">kivo.ai / workspace</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-400">
            <Share2 className="h-3.5 w-3.5 hover:text-neutral-600 transition" />
          </div>
        </div>

        {/* Dashboard workspace layout: Left sidebar + Main canvas with dreamy pastel aura */}
        <div className="grid min-h-[380px] sm:min-h-[440px] grid-cols-1 md:grid-cols-[210px_1fr]">
          {/* Left Sidebar (Matches reference image) */}
          <aside className="border-r border-neutral-200/70 bg-[#fafafa] p-3.5 flex flex-col justify-between hidden md:flex">
            <div>
              {/* Top brand icon & workspace picker */}
              <div className="mb-4">
                {/* Heart-like colorful icon */}
                <div className="mb-3.5 flex items-center justify-between">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-rose-400 via-pink-500 to-amber-300 flex items-center justify-center text-white shadow-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Workspace dropdown item */}
                <div className="flex items-center justify-between rounded-lg p-1.5 hover:bg-neutral-200/50 transition cursor-pointer text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-fuchsia-600 text-white font-bold text-[10px] flex items-center justify-center shadow-2xs">
                      s
                    </span>
                    <span className="font-medium text-neutral-800 text-[13px]">{userName}&apos;s Kivo</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                </div>
              </div>

              {/* + New Button (Selected state from image) */}
              <div className="mb-3">
                <button className="w-full flex items-center gap-2.5 rounded-xl bg-neutral-200/70 hover:bg-neutral-200 px-3 py-2 text-[13px] font-semibold text-neutral-900 transition">
                  <PenSquare className="h-3.5 w-3.5 text-neutral-800" />
                  <span>New</span>
                </button>
              </div>

              {/* Navigation list */}
              <nav className="space-y-0.5 text-xs text-neutral-600">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-100 hover:text-neutral-900 transition cursor-pointer">
                  <Search className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Search</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-100 hover:text-neutral-900 transition cursor-pointer">
                  <LayoutGrid className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Projects</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-neutral-100 hover:text-neutral-900 transition cursor-pointer">
                  <Compass className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Connectors</span>
                </div>
              </nav>

              {/* Projects section */}
              <div className="mt-6 pt-3 border-t border-neutral-200/70">
                <div className="text-[11px] font-medium text-neutral-400 px-3 mb-1.5">Projects</div>
                <div className="text-[11px] text-neutral-500 px-3">No recent projects</div>
              </div>

              {/* Recent chats section */}
              <div className="mt-4">
                <div className="text-[11px] font-medium text-neutral-400 px-3 mb-1.5">Recent chats</div>
                <div className="text-[11px] text-neutral-500 px-3">No chats yet</div>
              </div>
            </div>

            {/* Bottom status */}
            <div className="pt-3 text-[10px] text-neutral-400 flex items-center gap-1.5 px-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Engine ready</span>
            </div>
          </aside>

          {/* Right Main Canvas: Dreamy atmospheric aura from user reference */}
          <div className="relative overflow-hidden bg-white flex flex-col items-center justify-center p-6 sm:p-12 text-center min-h-[380px] sm:min-h-[440px]">
            {/* Ambient pastel gradient auras (Sky blue, soft indigo, gentle rose pink) */}
            <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-blue-200/40 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-pink-200/45 blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 -left-16 w-60 h-60 rounded-full bg-purple-100/40 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-72 h-72 rounded-full bg-rose-200/35 blur-3xl pointer-events-none" />

            {/* Floating Top Pill */}
            <div className="relative mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/90 bg-white/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm hover:border-neutral-300 transition cursor-pointer">
                <span className="flex items-center gap-1">
                  <span className="text-blue-500">✦</span>
                  <span className="text-pink-500">🌸</span>
                </span>
                <span>Add AI to your apps</span>
                <ArrowRight className="h-3 w-3 text-neutral-400" />
              </div>
            </div>

            {/* Headline matching image */}
            <h3 className="relative text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 mb-8 sm:mb-10">
              What should we build, {userName}?
            </h3>

            {/* Floating Prompt Card Capsule (Direct reference from image) */}
            <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl border border-neutral-200/90 bg-white/95 backdrop-blur-md p-4 sm:p-5 shadow-xl shadow-neutral-900/5 text-left transition hover:border-neutral-300">
              <p className="text-sm sm:text-[15px] text-neutral-400 select-none mb-5 font-normal">
                Ask Kivo to create a dashboard to...
              </p>

              <div className="flex items-center justify-between pt-1">
                {/* Left + button */}
                <button
                  type="button"
                  aria-label="Add attachment"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition"
                >
                  <Plus className="h-4 w-4" />
                </button>

                {/* Right controls: Build pill dropdown + Mic */}
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-1 rounded-full bg-neutral-100 hover:bg-neutral-200/80 px-3 py-1 text-xs font-semibold text-neutral-800 transition cursor-pointer">
                    <span>Build</span>
                    <ChevronDown className="h-3 w-3 text-neutral-500" />
                  </div>
                  <button
                    type="button"
                    aria-label="Voice input"
                    className="text-neutral-400 hover:text-neutral-700 transition"
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

