"use client";

import React, { useState, useMemo } from "react";
import {
  FolderOpen,
  Folder,
  FileCode,
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Globe,
  FilePlus,
  FolderPlus,
  AlertCircle,
} from "lucide-react";
import { FilesMap, ProjectCheckpoint } from "@/types/builder";

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
              className="group flex items-center justify-between py-1 px-1.5 rounded-lg text-xs text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer transition"
            >
              <div className="flex items-center gap-1.5 truncate">
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
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
                  className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-neutral-700"
                >
                  <FilePlus className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartCreate("folder", node.fullPath);
                  }}
                  title={`New folder in ${node.fullPath}`}
                  className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-neutral-700"
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
          className={`group flex items-center justify-between py-1 px-1.5 rounded-lg text-xs cursor-pointer transition ${
            isActive
              ? "bg-neutral-200/80 text-neutral-900 font-semibold shadow-2xs"
              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
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
    <aside className="w-56 border-r border-neutral-200 bg-[#fafafa] flex flex-col h-full shrink-0 select-none text-neutral-900">
      {/* Sidebar Header: Files */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2 bg-white">
        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
          <FolderOpen className="w-3.5 h-3.5 text-neutral-400" />
          Files
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleStartCreate("file", "")}
            title="Create new file in root"
            className="hover:text-neutral-900 p-1 rounded hover:bg-neutral-100 transition text-neutral-400 cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleStartCreate("folder", "")}
            title="Create new folder in root"
            className="hover:text-neutral-900 p-1 rounded hover:bg-neutral-100 transition text-neutral-400 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">

            {/* Inline file/folder creator */}
            {createMode !== "none" && (
              <form onSubmit={handleCreateSubmit} className="p-2.5 bg-white rounded-xl border border-neutral-200 mb-2 space-y-2 shadow-xs">
                <div className="text-[10px] text-neutral-600 font-medium flex items-center gap-1">
                  {createMode === "file" ? <FilePlus className="w-3 h-3 text-emerald-600" /> : <FolderPlus className="w-3 h-3 text-amber-600" />}
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
                  className="w-full bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
                />

                {validationError && (
                  <div className="text-[10px] text-rose-600 flex items-center gap-1">
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
                    className="text-[10px] px-2 py-0.5 rounded text-neutral-500 hover:text-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-[10px] px-2.5 py-0.5 rounded bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition"
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
        </div>
      </aside>
    );
  }
