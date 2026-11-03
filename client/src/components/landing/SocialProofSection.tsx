"use client";

import React from "react";
import { useReveal } from "./useReveal";

/* ─────────────────────────────────────────────────────────
   SOCIAL PROOF / STATS
   ───────────────────────────────────────────────────────── */
export function SocialProofSection() {
  const reveal = useReveal(0.1);

  const stats = [
    { value: "50k+", label: "Lines generated daily", note: "Powered by Groq Llama 3.3" },
    { value: "<4s", label: "Average generation time", note: "Full application structure" },
    { value: "100%", label: "In-browser runtime", note: "Zero remote build dependency" },
  ];

  return (
    <section className="border-t border-neutral-200/80 bg-white py-16 sm:py-20">
      <div
        ref={reveal.ref}
        className={`mx-auto max-w-[1240px] px-6 sm:px-10 lg:px-12 transition-all duration-700 ${
          reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map(({ value, label, note }) => (
            <div
              key={label}
              className="text-center sm:text-left p-6 rounded-2xl border border-neutral-200/80 bg-neutral-50/60 shadow-2xs"
            >
              <div className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">{value}</div>
              <p className="mt-1.5 text-sm font-semibold text-neutral-800">{label}</p>
              <p className="mt-0.5 text-[12px] text-neutral-500">{note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

