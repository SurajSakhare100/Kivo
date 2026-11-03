"use client";

import Link from "next/link";
import React from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useReveal } from "./useReveal";

/* ─────────────────────────────────────────────────────────
   FINAL CTA
   ───────────────────────────────────────────────────────── */
export function FinalCTASection() {
  const reveal = useReveal(0.1);

  return (
    <section className="border-t border-neutral-200/80 bg-gradient-to-b from-white to-neutral-50/80 py-24 sm:py-32">
      <div
        ref={reveal.ref}
        className={`mx-auto max-w-[1240px] px-6 sm:px-10 lg:px-12 transition-all duration-700 ${
          reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-neutral-900 sm:text-4xl lg:text-5xl">
            Ready to build something?
          </h2>
          <p className="mt-4 text-base leading-7 text-neutral-600 max-w-md mx-auto">
            Start with a description. Get a working React app. It&apos;s that simple.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-neutral-900 px-7 text-[14px] font-medium text-white transition hover:bg-neutral-800 shadow-md shadow-neutral-900/10 active:scale-98"
            >
              Open Kivo Builder
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-7 text-[14px] font-medium text-neutral-700 transition hover:bg-neutral-50 hover:border-neutral-300"
            >
              View on GitHub
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

