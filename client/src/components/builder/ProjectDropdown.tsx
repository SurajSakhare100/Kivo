"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Plus,
  Check,
  Trash2,
  FolderKanban,
  Sparkles,
  Layout,
  Globe,
  ShoppingBag,
  User,
  Layers,
  X,
} from "lucide-react";
import { Project, ProjectType } from "@/types/builder";

interface ProjectDropdownProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, type: ProjectType) => void;
  onDeleteProject: (id: string) => void;
}

const PROJECT_TYPE_ICONS: Record<ProjectType, React.ComponentType<{ className?: string }>> = {
  custom: Sparkles,
  landing_page: Layout,
  dashboard: Layers,
  portfolio: User,
  ecommerce: ShoppingBag,
  blog: Globe,
};

export function ProjectDropdown({
  projects,
  activeProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}: ProjectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectType, setNewProjectType] = useState<ProjectType>("custom");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), newProjectType);
    setNewProjectName("");
    setNewProjectType("custom");
    setIsCreateModalOpen(false);
    setIsOpen(false);
  };

  const ActiveIcon = activeProject
    ? PROJECT_TYPE_ICONS[activeProject.type] || FolderKanban
    : FolderKanban;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Top-Left Org-Style Project Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex max-w-[240px] items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-2.5 py-1.5 text-xs transition hover:bg-neutral-900 hover:border-neutral-700 cursor-pointer"
        title="Switch project"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-neutral-800 text-neutral-300">
          <ActiveIcon className="h-3 w-3 text-emerald-400" />
        </div>
        <span className="font-semibold text-white max-w-[130px] truncate">
          {activeProject?.name || "Select Project"}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-neutral-800 bg-[#0d0d0f] shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800/80 text-[11px] text-neutral-400 mb-1">
            <span className="font-medium uppercase tracking-wider text-neutral-500 text-[10px]">
              Projects ({projects.length})
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              New
            </button>
          </div>

          {/* Project List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 py-1">
            {projects.map((proj) => {
              const isSelected = activeProject?.id === proj.id;
              const Icon = PROJECT_TYPE_ICONS[proj.type] || FolderKanban;

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    onSelectProject(proj.id);
                    setIsOpen(false);
                  }}
                  className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? "bg-neutral-800/80 text-white font-medium"
                      : "text-neutral-300 hover:bg-neutral-800/40 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 mr-2">
                    <div
                      className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-neutral-800 text-neutral-400 group-hover:text-neutral-200"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="truncate text-xs">{proj.name}</div>
                      <div className="text-[10px] text-neutral-500 capitalize">
                        {proj.type.replace("_", " ")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete project "${proj.name}"?`)) {
                            onDeleteProject(proj.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded-md transition cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer: Create Project Button */}
          <div className="border-t border-neutral-800/80 pt-1.5 mt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsCreateModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 font-medium transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              Create New Project
            </button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl border border-neutral-800 bg-[#0d0d0f] shadow-2xl p-6 text-neutral-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Create New Project</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My Next.js App"
                  required
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900/60 text-xs text-white placeholder:text-neutral-600 focus:outline-hidden focus:border-neutral-600 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">
                  Project Archetype
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "custom", label: "Custom App" },
                      { id: "landing_page", label: "Landing Page" },
                      { id: "dashboard", label: "Dashboard" },
                      { id: "portfolio", label: "Portfolio" },
                    ] as const
                  ).map((arch) => (
                    <button
                      key={arch.id}
                      type="button"
                      onClick={() => setNewProjectType(arch.id)}
                      className={`py-2 px-3 rounded-xl border text-xs text-left transition cursor-pointer ${
                        newProjectType === arch.id
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-medium"
                          : "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      {arch.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs text-neutral-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition disabled:opacity-40"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
