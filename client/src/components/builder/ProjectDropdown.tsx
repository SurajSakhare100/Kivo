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
      {/* Top-Left Project Selector Button (White Mode) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex max-w-[260px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-2.5 py-1 text-xs transition hover:bg-neutral-50 hover:border-neutral-300 shadow-2xs cursor-pointer text-left"
        title="Switch project"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800 shrink-0">
          <ActiveIcon className="h-3 w-3 text-emerald-600" />
        </div>
        <span className="font-semibold text-neutral-900 max-w-[140px] truncate">
          {activeProject?.name || "Select Project"}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-neutral-900" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu (White Mode) */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-neutral-200 bg-white shadow-xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 text-[11px] text-neutral-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-neutral-400 text-[10px]">
              Projects ({projects.length})
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold transition cursor-pointer"
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
                      ? "bg-neutral-100 text-neutral-900 font-semibold shadow-2xs"
                      : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 mr-2">
                    <div
                      className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-neutral-100 text-neutral-500 group-hover:text-neutral-800"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="truncate text-xs">{proj.name}</div>
                      <div className="text-[10px] text-neutral-400 capitalize">
                        {proj.type.replace("_", " ")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete project "${proj.name}"?`)) {
                            onDeleteProject(proj.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-600 p-1 rounded-md transition cursor-pointer"
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
          <div className="border-t border-neutral-100 pt-1.5 mt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsCreateModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs text-white font-semibold transition cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              Create New Project
            </button>
          </div>
        </div>
      )}

      {/* Create Project Modal (White Mode) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl border border-neutral-200 bg-white shadow-2xl p-6 text-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900">Create New Project</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:text-neutral-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My Next.js App"
                  required
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-400 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5">
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
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold shadow-2xs"
                          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      {arch.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
