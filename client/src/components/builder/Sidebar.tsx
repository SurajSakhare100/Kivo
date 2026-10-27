"use client";

import React, { useState, useMemo } from "react";
import {
  FolderOpen,
  Folder,
  FileCode,
  FileText,
  Plus,
  Trash2,
  RotateCcw,
  History,
  ChevronDown,
  ChevronRight,
  LogOut,
  Settings,
  Globe,
  User,
  FilePlus,
  FolderPlus,
  AlertCircle,
} from "lucide-react";
import { FilesMap, ProjectCheckpoint } from "@/types/builder";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  files: FilesMap;
  activeFile: string;
  checkpoints: ProjectCheckpoint[];
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onRestoreCheckpoint: (checkpointId: string) => void;
  onUndoLastCheckpoint: () => void;
}

interface TreeItem {
  name: string;
  fullPath: string;
  isFolder: boolean;
  children: TreeItem[];
}

function buildTree(paths: string[]): TreeItem[] {
  const root: TreeItem = { name: "", fullPath: "", isFolder: true, children: [] };

  for (const path of paths) {
    const parts = path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      let child = current.children.find((c) => c.name === part);
      if (!child) {
        child = {
          name: part,
          fullPath: currentPath,
          isFolder: !isLast,
          children: [],
        };
        current.children.push(child);
      }
      current = child;
    }
  }

  function sortNodes(nodes: TreeItem[]) {
    nodes.sort((a, b) => {
      if (a.isFolder === b.isFolder) {
        return a.name.localeCompare(b.name);
      }
      return a.isFolder ? -1 : 1;
    });
    for (const node of nodes) {
      if (node.isFolder) {
        sortNodes(node.children);
      }
    }
  }

  sortNodes(root.children);
  return root.children;
}

export function Sidebar({
  files,
  activeFile,
  checkpoints,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRestoreCheckpoint,
  onUndoLastCheckpoint,
}: SidebarProps) {
  const { user, isAuthenticated, openTokenSettings, openLoginModal, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"files" | "history">("files");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  // File and Folder Creation state
  const [createMode, setCreateMode] = useState<"none" | "file" | "folder">("none");
  const [targetParentFolder, setTargetParentFolder] = useState<string>("");
  const [inputName, setInputName] = useState("");
  const [validationError, setValidationError] = useState("");

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    "src/components": true,
  });

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  const handleStartCreate = (mode: "file" | "folder", parentFolder = "") => {
    setCreateMode(mode);
    setTargetParentFolder(parentFolder);
    setInputName("");
    setValidationError("");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    let raw = inputName.trim();
    if (!raw) {
      setValidationError("Name cannot be empty");
      return;
    }

    // STRICT VALIDATION: Ensure path does NOT escape outside project root!
    if (raw.includes("..") || raw.includes(":\\") || raw.startsWith("/") || raw.startsWith("\\")) {
      setValidationError("Cannot create files/folders outside project root");
      return;
    }

    // Strip leading or trailing slashes
    raw = raw.replace(/^[\/\\]+/, "").replace(/[\/\\]+$/, "");

    let fullPath = targetParentFolder ? `${targetParentFolder}/${raw}` : raw;

    // Further verify no '..' exists in resolved path
    if (fullPath.includes("..")) {
      setValidationError("Path traversal outside project root is not permitted");
      return;
    }

    if (createMode === "folder") {
      // Create folder placeholder so it is stored in database and visible in tree
      onCreateFile(`${fullPath}/.gitkeep`);
      setExpandedFolders((prev) => ({ ...prev, [fullPath]: true }));
    } else {
      // If no file extension provided, default to .tsx
      if (!fullPath.includes(".")) {
        fullPath += ".tsx";
      }
      onCreateFile(fullPath);
      // Auto-expand parent folders
      const parts = fullPath.split("/");
      parts.pop();
      let acc = "";
      parts.forEach((p) => {
        acc = acc ? `${acc}/${p}` : p;
        setExpandedFolders((prev) => ({ ...prev, [acc]: true }));
      });
    }

    setCreateMode("none");
    setInputName("");
    setTargetParentFolder("");
  };

  // Build hierarchical tree from virtual file keys
  const treeNodes = useMemo(() => {
    return buildTree(Object.keys(files));
  }, [files]);

  const renderFileIcon = (fileName: string) => {
    if (fileName.endsWith(".tsx") || fileName.endsWith(".jsx")) {
      return <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
    if (fileName.endsWith(".ts") || fileName.endsWith(".js")) {
      return <FileCode className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
    }
    if (fileName.endsWith(".css")) {
      return <FileCode className="w-3.5 h-3.5 text-pink-400 shrink-0" />;
    }
    if (fileName.endsWith(".json")) {
      return <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    if (fileName.endsWith(".html")) {
      return <Globe className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
  };

  const renderTree = (nodes: TreeItem[], depth = 0) => {
    return nodes.map((node) => {
      // Skip rendering empty folder placeholders (.gitkeep)
      if (!node.isFolder && node.name === ".gitkeep") {
        return null;
      }

      if (node.isFolder) {
        const isExpanded = !!expandedFolders[node.fullPath];
        return (
          <div key={node.fullPath} className="select-none">
            <div
              onClick={() => toggleFolder(node.fullPath)}
              style={{ paddingLeft: `${depth * 12 + 6}px` }}
              className="group flex items-center justify-between py-1 px-1.5 rounded-md text-xs text-neutral-300 hover:bg-neutral-900/60 hover:text-white cursor-pointer transition"
            >
              <div className="flex items-center gap-1.5 truncate">
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-neutral-500 shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-neutral-500 shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span className="truncate font-medium">{node.name}</span>
              </div>

              {/* Quick create inside folder actions */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartCreate("file", node.fullPath);
                  }}
                  title={`New file in ${node.fullPath}`}
                  className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
                >
                  <FilePlus className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartCreate("folder", node.fullPath);
                  }}
                  title={`New folder in ${node.fullPath}`}
                  className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
                >
                  <FolderPlus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {isExpanded && renderTree(node.children, depth + 1)}
          </div>
        );
      }

      // File Row
      const isActive = node.fullPath === activeFile;
      return (
        <div
          key={node.fullPath}
          onClick={() => onSelectFile(node.fullPath)}
          style={{ paddingLeft: `${depth * 12 + 20}px` }}
          className={`group flex items-center justify-between py-1 px-1.5 rounded-md text-xs cursor-pointer transition ${
            isActive
              ? "bg-neutral-800/90 text-white font-medium"
              : "text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {renderFileIcon(node.name)}
            <span className="truncate">{node.name}</span>
          </div>

          {/* Don't allow deleting core template files */}
          {node.fullPath !== "package.json" &&
            node.fullPath !== "app/page.tsx" &&
            node.fullPath !== "app/layout.tsx" &&
            node.fullPath !== "src/App.tsx" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete ${node.fullPath}?`)) {
                  onDeleteFile(node.fullPath);
                }
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition"
              title="Delete file"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      );
    });
  };

  return (
    <aside className="w-64 border-r border-neutral-800 bg-[#09090b] flex flex-col h-full shrink-0 select-none">
      {/* Nav Tabs */}
      <div className="flex border-b border-neutral-800/80 p-1 bg-neutral-950/40">
        <button
          onClick={() => setActiveTab("files")}
          className={`flex-1 py-1.5 text-[11px] font-medium rounded transition flex items-center justify-center gap-1.5 ${
            activeTab === "files"
              ? "bg-neutral-800 text-white"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Files
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-1.5 text-[11px] font-medium rounded transition flex items-center justify-center gap-1.5 ${
            activeTab === "history"
              ? "bg-neutral-800 text-white"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          History
          {checkpoints.length > 0 && (
            <span className="px-1 text-[9px] rounded-full bg-emerald-500/20 text-emerald-400">
              {checkpoints.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === "files" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              <span className="truncate">Files</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleStartCreate("file", "")}
                  title="Create new file in root"
                  className="hover:text-white p-1 rounded hover:bg-neutral-800 transition text-neutral-400"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleStartCreate("folder", "")}
                  title="Create new folder in root"
                  className="hover:text-white p-1 rounded hover:bg-neutral-800 transition text-neutral-400"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Inline file/folder creator */}
            {createMode !== "none" && (
              <form onSubmit={handleCreateSubmit} className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-700/80 mb-2 space-y-2">
                <div className="text-[10px] text-neutral-400 font-medium flex items-center gap-1">
                  {createMode === "file" ? <FilePlus className="w-3 h-3 text-emerald-400" /> : <FolderPlus className="w-3 h-3 text-amber-400" />}
                  <span>
                    New {createMode} {targetParentFolder ? `in ${targetParentFolder}/` : "in root"}
                  </span>
                </div>

                <input
                  type="text"
                  placeholder={createMode === "file" ? "e.g. Card.tsx or components/Card.tsx" : "e.g. utils or components/cards"}
                  value={inputName}
                  onChange={(e) => {
                    setInputName(e.target.value);
                    setValidationError("");
                  }}
                  autoFocus
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />

                {validationError && (
                  <div className="text-[10px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateMode("none");
                      setInputName("");
                      setValidationError("");
                    }}
                    className="text-[10px] px-2 py-0.5 rounded text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-[10px] px-2.5 py-0.5 rounded bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition"
                  >
                    Create {createMode === "file" ? "File" : "Folder"}
                  </button>
                </div>
              </form>
            )}

            {/* Hierarchical Folder & File Tree */}
            <div className="space-y-0.5 pt-1">
              {renderTree(treeNodes)}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Checkpoints
              </span>
              <button
                onClick={onUndoLastCheckpoint}
                disabled={checkpoints.length < 2}
                className="text-[10px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 disabled:opacity-40 disabled:hover:text-emerald-400 transition"
              >
                <RotateCcw className="w-3 h-3" />
                Undo Last
              </button>
            </div>

            {checkpoints.length === 0 ? (
              <div className="text-center py-8 text-neutral-600 text-xs">
                No checkpoints saved yet. Checkpoints are automatically created before AI edits.
              </div>
            ) : (
              <div className="space-y-2">
                {checkpoints.map((cp, idx) => (
                  <div
                    key={cp.id}
                    className="p-2.5 rounded-lg border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] text-neutral-500">
                      <span>{new Date(cp.createdAt).toLocaleTimeString()}</span>
                      {idx === 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                      {cp.summary}
                    </p>
                    <button
                      onClick={() => onRestoreCheckpoint(cp.id)}
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-medium pt-1"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      Restore this snapshot
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account menu */}
      <div className="relative mt-auto border-t border-neutral-800 p-2.5">
        {isAccountMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close account menu"
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setIsAccountMenuOpen(false)}
            />
            <div className="absolute bottom-[calc(100%-4px)] left-2 right-2 z-40 rounded-xl border border-neutral-800 bg-[#111114] p-1.5 shadow-xl">
              {isAuthenticated && user && (
                <div className="border-b border-neutral-800 px-2.5 py-2">
                  <p className="truncate text-xs font-medium text-white">{user.name}</p>
                  <p className="truncate text-[10px] text-neutral-500">{user.email}</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  openTokenSettings();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
              >
                <Settings className="h-3.5 w-3.5 text-neutral-400" />
                Settings
              </button>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    void logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5 text-neutral-400" />
                  Log out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    openLoginModal();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
                >
                  <User className="h-3.5 w-3.5 text-neutral-400" />
                  Sign in
                </button>
              )}
            </div>
          </>
        )}
        <button
          type="button"
          aria-expanded={isAccountMenuOpen}
          onClick={() => setIsAccountMenuOpen((open) => !open)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-neutral-900"
        >
          {isAuthenticated && user?.picture ? (
            <img
              src={user.picture}
              alt=""
              className="h-7 w-7 rounded-full border border-neutral-700 object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-neutral-400">
              <User className="h-3.5 w-3.5" />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-200">
            {isAuthenticated && user ? user.name : "Guest"}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-neutral-500 transition ${isAccountMenuOpen ? "rotate-180" : ""}`} />
        </button>
      </div>
    </aside>
  );
}
