"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronDown,
  Clock,
  Compass,
  FileCode2,
  FolderKanban,
  HelpCircle,
  Home as HomeIcon,
  Layers3,
  LayoutGrid,
  Mic,
  MoreVertical,
  Plus,
  Radio,
  Search,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  User,
  Zap,
  Settings,
  LogOut,
} from "lucide-react";
import { Project } from "@/types/builder";
import { listProjects, createProject, deleteProject } from "@/lib/storage/db";
import { useAuth } from "@/context/AuthContext";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "projects" ? "projects" : "home";

  const { user, tokens, isAuthenticated, openLoginModal, openTokenSettings, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"home" | "projects" | "starred" | "recent">(initialTab);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isTopProfileOpen, setIsTopProfileOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [projectType, setProjectType] = useState<"custom" | "landing_page" | "dashboard" | "portfolio">("custom");

  // Load existing projects from IndexedDB
  const reloadProjects = async () => {
    try {
      const list = await listProjects();
      setProjects(list);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  useEffect(() => {
    reloadProjects();
  }, []);

  // Handle URL query prompt if passed from landing page
  useEffect(() => {
    const urlPrompt = searchParams.get("prompt");
    if (urlPrompt) {
      setPrompt(urlPrompt);
    }
  }, [searchParams]);

  // Handle New Project Creation
  const handleStartProject = async (customPrompt?: string, chosenType?: string) => {
    const promptText = (customPrompt || prompt).trim();
    if (isCreating) return;
    setIsCreating(true);

    try {
      const type = (chosenType || projectType) as any;
      const title = promptText
        ? promptText.slice(0, 32).trim() + (promptText.length > 32 ? "..." : "")
        : "Untitled Project";

      const { project } = await createProject(title, type, promptText);
      const query = promptText ? `?prompt=${encodeURIComponent(promptText)}` : "";
      router.push(`/project/${encodeURIComponent(project.id)}${query}`);
    } catch (err) {
      console.error("Failed to create project:", err);
      setIsCreating(false);
    }
  };

  // Handle Project Delete
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project?")) {
      await deleteProject(id);
      await reloadProjects();
    }
  };

  // Filtered projects for the "All Projects" view
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [projects, searchQuery]);

  const userName = user?.name ? user.name.split(" ")[0] : "suraj";
  const tokensRemaining = tokens?.tokensRemaining ?? 50000;

  // Relative time helper
  const formatRelativeTime = (isoString: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
      return `${Math.floor(diffSec / 86400)} days ago`;
    } catch {
      return "Recently";
    }
  };

  const templates = [
    { title: "Next.js 16 App", desc: "Full-stack React with Tailwind v4", type: "custom", prompt: "Create a modern Next.js app with responsive header, hero section, and interactive features" },
    { title: "SaaS Analytics Dashboard", desc: "Metrics, charts, and data tables", type: "dashboard", prompt: "Build an interactive SaaS metrics dashboard with KPI cards, revenue graph, and user table" },
    { title: "Product Landing Page", desc: "High-conversion marketing site", type: "landing_page", prompt: "Create a clean, high-conversion product landing page for an AI developer tool" },
    { title: "Minimal Portfolio", desc: "Editorial designer showcase", type: "portfolio", prompt: "Build a sleek editorial portfolio showcasing featured case studies and contact form" },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-neutral-900 font-sans antialiased">
      {/* ─────────────────────────────────────────────────────────
          LEFT SIDEBAR (Matches Image 1 & 2)
          ───────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col justify-between border-r border-neutral-200 bg-[#fafafa] p-3.5 select-none">
        <div>
          {/* Logo & Global Search */}
          <div className="flex items-center justify-between mb-3 px-1">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-[11px] font-bold text-white shadow-2xs">
                K
              </span>
              <span className="text-[15px] font-bold tracking-tight text-neutral-900">kivo</span>
            </Link>
          </div>

          {/* Quick search button */}
          <div className="mb-4">
            <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-400 shadow-2xs">
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-neutral-400" />
                <span>Search</span>
              </div>
              <kbd className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-mono text-neutral-500">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* User profile / Workspace Switcher with Sign Out */}
          <div className="relative mb-4">
            <button
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="w-full flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-2 hover:bg-neutral-50 transition shadow-2xs cursor-pointer text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-6 w-6 rounded-lg bg-fuchsia-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 truncate">
                    {userName}&apos;s Kivo
                  </p>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                    Free Tier
                  </span>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
            </button>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-full rounded-xl border border-neutral-200 bg-white shadow-xl z-50 p-1.5 text-xs animate-in fade-in slide-in-from-top-1">
                <div className="px-2.5 py-2 border-b border-neutral-100">
                  <p className="font-semibold text-neutral-900 truncate">
                    {user?.name || `${userName}'s Workspace`}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {user?.email || "Google Account"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    openTokenSettings();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-700 hover:bg-neutral-100 transition cursor-pointer mt-1"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Workspace Settings</span>
                </button>
                <div className="my-1 border-t border-neutral-100" />
                <button
                  onClick={async () => {
                    setIsProfileMenuOpen(false);
                    await logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-[13px] font-medium">
            <button
              onClick={() => setActiveTab("home")}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition text-left cursor-pointer ${
                activeTab === "home"
                  ? "bg-neutral-200/70 text-neutral-900 font-semibold shadow-2xs"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <HomeIcon className="h-4 w-4" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveTab("projects")}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2 transition text-left cursor-pointer ${
                activeTab === "projects"
                  ? "bg-neutral-200/70 text-neutral-900 font-semibold shadow-2xs"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="h-4 w-4" />
                <span>Projects</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">{projects.length}</span>
            </button>

            <button
              onClick={() => setActiveTab("starred")}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition text-left cursor-pointer ${
                activeTab === "starred"
                  ? "bg-neutral-200/70 text-neutral-900 font-semibold"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <Star className="h-4 w-4" />
              <span>Starred</span>
            </button>

            <button
              onClick={() => setActiveTab("recent")}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition text-left cursor-pointer ${
                activeTab === "recent"
                  ? "bg-neutral-200/70 text-neutral-900 font-semibold"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Recently viewed</span>
            </button>

            {/* Switched "Shared with you" with "Settings" */}
            <button
              onClick={openTokenSettings}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition text-left cursor-pointer"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Info */}
        <div className="pt-4 border-t border-neutral-200 space-y-1 text-xs text-neutral-500 font-medium">
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-100 hover:text-neutral-800 transition">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Help Center</span>
          </Link>
          <div className="flex items-center justify-between px-3 py-1.5 text-neutral-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Engine online
            </span>
            <span>v1.0</span>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────
          MAIN CANVAS
          ───────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto">
        {/* Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200/80 px-6 sm:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {activeTab === "projects" ? "Workspace" : "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              onClick={openTokenSettings}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* User Profile */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsTopProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-neutral-200 p-1 pr-2.5 text-xs hover:border-neutral-300 transition cursor-pointer"
                >
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="text-neutral-800 font-medium text-xs hidden sm:inline">
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown className="h-3 w-3 text-neutral-400" />
                </button>

                {isTopProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-neutral-200 bg-white shadow-xl z-50 p-1.5 text-xs animate-in fade-in slide-in-from-top-1">
                    <div className="px-2.5 py-2 border-b border-neutral-100">
                      <p className="font-semibold text-neutral-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsTopProfileOpen(false);
                        openTokenSettings();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-700 hover:bg-neutral-100 transition cursor-pointer mt-1"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>Settings</span>
                    </button>
                    <div className="my-1 border-t border-neutral-100" />
                    <button
                      onClick={async () => {
                        setIsTopProfileOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 transition px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Log in
              </Link>
            )}
          </div>
        </header>

        {/* ─── TAB 1: HOME (Matches Image 1) ─── */}
        {activeTab === "home" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative min-h-[600px]">
            {/* Ambient subtle light pastel aura */}
            <div className="absolute top-1/4 -right-16 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 -left-16 w-96 h-96 rounded-full bg-pink-100/50 blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-emerald-50/50 blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-2xl text-center space-y-6">
              {/* Title & subtitle from Image 1 */}
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">
                  What will you build today?
                </h1>
                <p className="mt-3 text-sm sm:text-base text-neutral-600">
                  Create stunning apps & websites by chatting with AI.
                </p>
              </div>

              {/* Big Prompt Bar from Image 1 */}
              <div className="w-full rounded-2xl sm:rounded-3xl border border-neutral-200 bg-white p-3 sm:p-4 shadow-xl shadow-neutral-900/5 text-left transition focus-within:border-neutral-400 focus-within:ring-3 focus-within:ring-neutral-200/60">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleStartProject();
                    }
                  }}
                  placeholder="Let's build an MVP for my startup, dashboard, or portfolio..."
                  rows={3}
                  className="w-full resize-none bg-transparent px-2 text-sm sm:text-[15px] leading-6 text-neutral-900 outline-none placeholder:text-neutral-400"
                />

                <div className="flex items-center justify-between border-t border-neutral-100 pt-3 px-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Add context"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition"
                    >
                      <Plus className="h-4 w-4" />
                    </button>

                    <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700">
                      <span>Standard</span>
                      <ChevronDown className="h-3 w-3 text-neutral-400" />
                    </div>

                    <div className="hidden sm:inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-600 font-medium">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      <span>Plan</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Voice input"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
                    >
                      <Mic className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartProject()}
                      disabled={isCreating}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-neutral-800 disabled:opacity-50 cursor-pointer active:scale-98"
                    >
                      <span>{isCreating ? "Starting..." : "Build"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Starter Templates */}
              <div className="pt-4 text-left">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                  Or start from a template
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.title}
                      onClick={() => handleStartProject(tpl.prompt, tpl.type)}
                      className="flex items-start gap-3 p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 hover:bg-white hover:border-neutral-300 hover:shadow-sm transition text-left cursor-pointer group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0 group-hover:border-emerald-400 group-hover:text-emerald-600 transition">
                        <FileCode2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-900 group-hover:text-emerald-700 transition">
                          {tpl.title}
                        </h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{tpl.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: ALL PROJECTS (Matches Image 2) ─── */}
        {activeTab === "projects" && (
          <div className="flex-1 p-6 sm:p-10 max-w-6xl mx-auto w-full">
            {/* Header toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                  All projects
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Manage and continue working on your stored web applications.
                </p>
              </div>

              <button
                onClick={() => handleStartProject()}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 text-xs font-semibold text-white shadow-xs transition active:scale-98 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create project</span>
              </button>
            </div>

            {/* Search and filters bar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a project..."
                  className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 shadow-2xs"
                />
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 shadow-2xs">
                <span>Last edited</span>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
              </div>
            </div>

            {/* Projects Grid (Image 2) */}
            {filteredProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center bg-neutral-50/50">
                <FileCode2 className="mx-auto h-10 w-10 text-neutral-300 mb-3" />
                <h3 className="text-sm font-semibold text-neutral-800">No projects yet</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Click create project above or head to Home to build your first React app with AI.
                </p>
                <button
                  onClick={() => handleStartProject()}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New project</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/project/${encodeURIComponent(p.id)}`)}
                    className="group rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Thumbnail / Preview box */}
                      <div className="h-36 w-full rounded-xl bg-gradient-to-tr from-neutral-100 via-neutral-50 to-neutral-100 border border-neutral-200/60 flex items-center justify-center mb-3.5 relative overflow-hidden group-hover:border-neutral-300 transition">
                        <span className="h-10 w-10 rounded-xl bg-white border border-neutral-200 shadow-xs flex items-center justify-center font-bold text-neutral-700 text-sm group-hover:scale-105 transition-transform">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => handleDelete(e, p.id)}
                            title="Delete project"
                            className="p-1.5 rounded-lg bg-white/90 border border-neutral-200 text-neutral-500 hover:text-red-600 transition shadow-xs"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Project Title */}
                      <h4 className="text-sm font-bold text-neutral-900 truncate group-hover:text-blue-600 transition">
                        {p.name}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                        {p.description || "No prompt description"}
                      </p>
                    </div>

                    {/* Metadata Footer */}
                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                      <span>{formatRelativeTime(p.updatedAt)}</span>
                      <span className="font-mono uppercase text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">
                        {p.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: STARRED / RECENT EMPTY VIEWS ─── */}
        {(activeTab === "starred" || activeTab === "recent") && (
          <div className="flex-1 p-10 max-w-4xl mx-auto w-full flex flex-col items-center justify-center text-center">
            <Star className="h-10 w-10 text-neutral-300 mb-3" />
            <h3 className="text-base font-semibold text-neutral-800 capitalize">
              No {activeTab} projects yet
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Mark projects as starred to quickly access your priority workspaces.
            </p>
            <button
              onClick={() => setActiveTab("projects")}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Browse all projects
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
