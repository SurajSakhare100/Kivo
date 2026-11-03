"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Code2,
  Command,
  Compass,
  Eye,
  FileCode2,
  Globe,
  Layers3,
  LayoutGrid,
  Lock,
  MessageSquare,
  Mic,
  MonitorSmartphone,
  PenSquare,
  Play,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wand2,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/* ─────────────────────────────────────────────────────────
   Intersection Observer hook for scroll-reveal
   ───────────────────────────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─────────────────────────────────────────────────────────
   NAVIGATION (Crisp Light Mode, Constant Margins)
   ───────────────────────────────────────────────────────── */
function Navigation() {
  const { user, tokens, isAuthenticated, openLoginModal, openTokenSettings } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const tokensRemaining = tokens?.tokensRemaining ?? 50000;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-neutral-200/80 shadow-xs"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-6 sm:px-10 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Kivo home">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-[11px] font-bold text-white shadow-xs transition-transform group-hover:scale-105">
            K
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-neutral-900">kivo</span>
        </Link>

        {/* Center nav links — desktop */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-[13px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-[13px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
            How it works
          </a>
          <a href="#showcase" className="text-[13px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
            Showcase
          </a>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 p-1 pr-2.5 text-xs hover:border-neutral-300 transition cursor-pointer"
            >
              <img
                src={user.picture}
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="text-neutral-700 font-medium hidden sm:inline">{user.name.split(" ")[0]}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-[13px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer px-2"
            >
              Log in
            </Link>
          )}

          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-neutral-900 px-4 text-[13px] font-medium text-white transition hover:bg-neutral-800 shadow-xs"
          >
            Start building
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer"
            aria-label="Toggle menu"
          >
            <span
              className={`block h-0.5 w-5 bg-neutral-700 transition-transform ${
                mobileOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-neutral-700 transition-opacity ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-neutral-700 transition-transform ${
                mobileOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200/80 bg-white/95 backdrop-blur-xl px-6 pb-6 pt-4 space-y-4 shadow-lg">
          <a
            href="#features"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            How it works
          </a>
          <a
            href="#showcase"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            Showcase
          </a>
          {!isAuthenticated && (
            <button
              onClick={() => {
                openLoginModal();
                setMobileOpen(false);
              }}
              className="block text-sm font-medium text-neutral-600 cursor-pointer"
            >
              Sign in
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────
   HERO SECTION
   ───────────────────────────────────────────────────────── */
function HeroSection() {
  const { user } = useAuth();
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
    <section className="relative pt-32 pb-20 sm:pt-36 sm:pb-28 lg:pb-32 overflow-hidden bg-white">
      {/* Subtle warm/emerald background aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-emerald-500/[0.04] via-blue-500/[0.02] to-transparent rounded-full blur-[140px] pointer-events-none" />

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

        {/* Hero product mockup — modeled directly after user reference image */}
        <div className="animate-reveal-scale stagger-4 mx-auto mt-16 max-w-5xl">
          <ProductMockup userName={user?.name ? user.name.split(" ")[0] : "suraj"} />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   PRODUCT MOCKUP (Crafted exactly from user's uploaded image)
   ───────────────────────────────────────────────────────── */
function ProductMockup({ userName = "suraj" }: { userName?: string }) {
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
            <div className="pt-3 border-t border-neutral-200/70 text-[10px] text-neutral-400 flex items-center gap-1.5 px-3">
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

function FeaturesSection() {
  const reveal = useReveal(0.1);

  return (
    <section id="features" className="border-t border-neutral-200/80 bg-neutral-50/50 py-20 sm:py-28">
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

function HowItWorksSection() {
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

/* ─────────────────────────────────────────────────────────
   SHOWCASE / DEVELOPER SECTION
   ───────────────────────────────────────────────────────── */
function ShowcaseSection() {
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

/* ─────────────────────────────────────────────────────────
   SOCIAL PROOF / STATS
   ───────────────────────────────────────────────────────── */
function SocialProofSection() {
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

/* ─────────────────────────────────────────────────────────
   FINAL CTA
   ───────────────────────────────────────────────────────── */
function FinalCTASection() {
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

/* ─────────────────────────────────────────────────────────
   FOOTER (With BIG KIVO wordmark requested by user)
   ───────────────────────────────────────────────────────── */
function SiteFooter() {
  const footerLinks = {
    Product: [
      { label: "Builder", href: "/builder" },
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Showcase", href: "#showcase" },
    ],
    Resources: [
      { label: "Documentation", href: "#" },
      { label: "GitHub", href: "https://github.com" },
      { label: "Changelog", href: "#" },
    ],
    Company: [
      { label: "About", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  };

  return (
    <footer className="border-t border-neutral-200/80 bg-white overflow-hidden">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-10 lg:px-12 pt-14 sm:pt-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4" aria-label="Kivo home">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-[11px] font-bold text-white shadow-2xs">
                K
              </span>
              <span className="text-[16px] font-bold tracking-tight text-neutral-900">kivo</span>
            </Link>
            <p className="text-[13px] leading-6 text-neutral-500 max-w-xs">
              AI-powered in-browser development environment for building and previewing React applications instantly.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-neutral-800 mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-neutral-100 pt-8 pb-4">
          <p className="text-[12px] text-neutral-500">
            © {new Date().getFullYear()} Kivo. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
              aria-label="GitHub"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
              aria-label="X / Twitter"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>

        {/* BIG KIVO BRAND WORDMARK IN FOOTER WITH CREATIVE FONT */}
        <div className="pt-6 pb-2 text-center select-none overflow-hidden border-t border-neutral-100">
          <span className="font-kivo block text-[18vw] sm:text-[19vw] font-black tracking-tighter leading-none text-neutral-200/80 hover:text-neutral-300/90 transition-colors pointer-events-none select-none uppercase">
            KIVO
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE EXPORT (Gradient Background)
   ───────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50/40 via-white via-purple-50/20 via-white to-emerald-50/30 text-neutral-900 relative overflow-x-hidden">
      {/* Decorative ambient gradient backdrop orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-gradient-to-br from-blue-100/50 via-purple-100/30 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-gradient-to-bl from-pink-100/40 via-rose-100/20 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[600px] left-10 w-[550px] h-[450px] bg-gradient-to-tr from-emerald-100/40 via-teal-50/30 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ShowcaseSection />
      <SocialProofSection />
      <FinalCTASection />
      <SiteFooter />
    </main>
  );
}
