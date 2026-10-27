"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  Eye,
  Globe2,
  Layers3,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const FEATURES = [
  {
    icon: Layers3,
    title: "A thoughtful process",
    description: "Plan, generate, review, and refine in clear steps. See what the AI is doing as it works.",
  },
  {
    icon: Eye,
    title: "Preview as you build",
    description: "Your site comes to life beside the conversation. Switch between preview and source anytime.",
  },
  {
    icon: ShieldCheck,
    title: "Safety built in",
    description: "Generated output is checked and sanitized before it reaches your preview.",
  },
];

const EXAMPLES = [
  "A dark portfolio for a product designer",
  "A calm, editorial landing page for a coffee brand",
  "A dashboard for tracking personal finances",
];

export default function Home() {
  const { user, tokens, isAuthenticated, openLoginModal, openTokenSettings } = useAuth();
  const [prompt, setPrompt] = useState("");
  const builderHref = prompt.trim()
    ? `/builder?prompt=${encodeURIComponent(prompt.trim())}`
    : "/builder";

  const tokensRemaining = tokens?.tokensRemaining ?? 50000;

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-neutral-100">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between border-b border-neutral-900 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Kivo home">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-xs font-bold text-black">K</span>
          <span className="text-sm font-semibold tracking-tight">kivo</span>
        </Link>
        <div className="flex items-center gap-3">
          {/* Token Counter & Settings Trigger */}
          <button
            onClick={openTokenSettings}
            className="flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-700 transition cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>{tokensRemaining.toLocaleString()}</span>
            <span className="text-[10px] text-neutral-500 uppercase">{tokens?.plan || "free"}</span>
          </button>

          {/* User Sign In or Avatar */}
          {isAuthenticated && user ? (
            <button
              onClick={openTokenSettings}
              className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 p-1 pr-2.5 text-xs hover:border-neutral-700 transition cursor-pointer"
            >
              <img
                src={user.picture}
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover"
                onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
              />
              <span className="text-neutral-300 font-medium hidden sm:inline">{user.name.split(" ")[0]}</span>
            </button>
          ) : (
            <button
              onClick={openLoginModal}
              className="text-xs font-medium text-neutral-400 hover:text-white transition px-2 py-1 cursor-pointer"
            >
              Sign in
            </button>
          )}

          <Link
            href="/builder"
            className="inline-flex h-8 items-center gap-2 rounded-md bg-white px-3 text-xs font-medium text-black transition hover:bg-neutral-200"
          >
            Open builder
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-20 sm:px-8 sm:pt-28 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pb-32">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 text-xs text-neutral-500">
            <Sparkles className="h-3.5 w-3.5 text-neutral-300" aria-hidden="true" />
            AI-assisted website builder
          </div>
          <h1 className="max-w-2xl text-5xl font-medium leading-[1.04] tracking-[-0.055em] text-white sm:text-6xl lg:text-[4.5rem]">
            From idea
            <br />
            to <span className="text-neutral-500">website.</span>
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-6 text-neutral-500 sm:text-base sm:leading-7">
            Describe the site in your head. Kivo turns it into a working page you can preview, inspect, and refine.
          </p>

          <form
            className="mt-9 max-w-xl rounded-lg border border-neutral-800 bg-[#0a0a0a] p-2 transition focus-within:border-neutral-600"
            onSubmit={(event) => {
              event.preventDefault();
              window.location.href = builderHref;
            }}
          >
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  window.location.href = builderHref;
                }
              }}
              placeholder="A portfolio for a creative developer..."
              rows={2}
              className="min-h-[56px] w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-neutral-100 outline-none placeholder:text-neutral-700"
              aria-label="Describe the website you want to build"
            />
            <div className="flex items-center justify-between border-t border-neutral-800 pt-2">
              <span className="px-2 text-[10px] text-neutral-700">Start with a prompt, refine it as you go</span>
              <Link
                href={builderHref}
                className="inline-flex h-8 items-center gap-2 rounded-md bg-white px-3 text-xs font-medium text-black transition hover:bg-neutral-200"
              >
                Start building
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setPrompt(example)}
                className="rounded-full border border-neutral-900 px-3 py-1.5 text-[10px] text-neutral-600 transition hover:border-neutral-700 hover:text-neutral-300"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#090909] shadow-2xl shadow-black">
            <div className="flex h-11 items-center justify-between border-b border-neutral-800 px-3.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-neutral-700" />
                <span className="h-2 w-2 rounded-full bg-neutral-700" />
                <span className="h-2 w-2 rounded-full bg-neutral-700" />
              </div>
              <span className="text-[10px] text-neutral-600">kivo / preview</span>
              <MonitorSmartphone className="h-3.5 w-3.5 text-neutral-600" aria-hidden="true" />
            </div>
            <div className="grid min-h-[330px] grid-cols-[112px_1fr] sm:grid-cols-[140px_1fr]">
              <aside className="border-r border-neutral-800 p-3">
                <div className="mb-5 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-white text-[9px] font-bold text-black">K</span>
                  <span className="text-[10px] font-medium text-neutral-300">Workspace</span>
                </div>
                <div className="mb-2 text-[8px] uppercase tracking-widest text-neutral-700">Project</div>
                {["Landing page", "Portfolio", "Dashboard"].map((label, index) => (
                  <div
                    key={label}
                    className={`mb-1 flex items-center gap-2 rounded px-2 py-1.5 text-[9px] ${
                      index === 1 ? "bg-neutral-800 text-neutral-200" : "text-neutral-600"
                    }`}
                  >
                    {index === 0 ? <Globe2 className="h-3 w-3" /> : index === 1 ? <Code2 className="h-3 w-3" /> : <Layers3 className="h-3 w-3" />}
                    {label}
                  </div>
                ))}
                <div className="mt-6 border-t border-neutral-800 pt-3">
                  <div className="mb-2 text-[8px] uppercase tracking-widest text-neutral-700">Steps</div>
                  {["Plan", "Generate", "Review"].map((label, index) => (
                    <div key={label} className="mb-2 flex items-center gap-1.5 text-[9px] text-neutral-500">
                      {index === 0 ? (
                        <Check className="h-3 w-3 text-neutral-300" />
                      ) : index === 1 ? (
                        <WandSparkles className="h-3 w-3 text-neutral-300" />
                      ) : (
                        <span className="h-3 w-3 rounded-full border border-neutral-700" />
                      )}
                      {label}
                    </div>
                  ))}
                </div>
              </aside>
              <div className="flex min-w-0 flex-col">
                <div className="flex h-9 items-center justify-between border-b border-neutral-800 px-3">
                  <span className="text-[9px] text-neutral-500">Developer portfolio</span>
                  <span className="flex items-center gap-1 text-[9px] text-neutral-500">
                    <Eye className="h-3 w-3" /> Preview
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-center px-5 py-6 sm:px-8">
                  <div className="mb-3 h-2 w-16 rounded-full bg-neutral-700" />
                  <div className="h-4 w-4/5 rounded bg-neutral-200" />
                  <div className="mt-1.5 h-4 w-3/5 rounded bg-neutral-400" />
                  <div className="mt-3 h-1.5 w-4/5 rounded bg-neutral-800" />
                  <div className="mt-1.5 h-1.5 w-3/5 rounded bg-neutral-800" />
                  <div className="mt-5 flex gap-2">
                    <div className="h-6 w-16 rounded bg-white" />
                    <div className="h-6 w-16 rounded border border-neutral-700" />
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((item) => (
                      <div key={item} className="h-14 rounded-md border border-neutral-800 bg-[#0c0c0c] p-2">
                        <div className="mb-2 h-2 w-5 rounded bg-neutral-700" />
                        <div className="h-1.5 w-4/5 rounded bg-neutral-800" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 flex items-center justify-center gap-2 text-[10px] text-neutral-700">
            <Code2 className="h-3 w-3" aria-hidden="true" />
            Live preview and editable source
          </p>
        </div>
      </section>

      <section className="border-t border-neutral-900">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-9 flex items-end justify-between gap-6">
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-neutral-600">Built for the making</p>
              <h2 className="text-2xl font-medium tracking-tight text-white sm:text-3xl">Simple tools. More making.</h2>
            </div>
            <ArrowDown className="mb-1 hidden h-4 w-4 text-neutral-600 sm:block" aria-hidden="true" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }, index) => (
              <article key={title} className="rounded-lg border border-neutral-900 bg-[#080808] p-5 transition hover:border-neutral-800">
                <div className="mb-8 flex h-8 w-8 items-center justify-center rounded-md border border-neutral-800 text-neutral-300">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="mb-2 text-[10px] text-neutral-700">0{index + 1}</div>
                <h3 className="text-sm font-medium text-neutral-200">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-neutral-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-900">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-5 py-6 text-[10px] text-neutral-700 sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-white text-[9px] font-bold text-black">K</span>
            <span className="text-neutral-400">Kivo</span>
          </div>
          <span>Built with care and a little AI.</span>
          <a href="https://github.com" className="inline-flex items-center gap-1.5 transition hover:text-neutral-300">
            <Code2 className="h-3 w-3" aria-hidden="true" />
            Built for developers
          </a>
        </div>
      </footer>
    </main>
  );
}
