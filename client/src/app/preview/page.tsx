"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FilesMap } from "@/types/builder";
import { getProjectFiles } from "@/lib/storage/db";
import { generatePreviewHtml } from "@/lib/runtime/bundler";
import { Loader2, RefreshCw } from "lucide-react";

function PreviewContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  const [files, setFiles] = useState<FilesMap | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadFiles = async () => {
    setLoading(true);
    try {
      // 1. Try reading from sessionStorage (fastest for live preview from builder)
      const cached = sessionStorage.getItem("kivo_preview_files");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && Object.keys(parsed).length > 0) {
            setFiles(parsed);
            setLoading(false);
            return;
          }
        } catch {
          // fallback to db
        }
      }

      // 2. Try loading from IndexedDB if projectId is passed
      if (projectId) {
        const dbFiles = await getProjectFiles(projectId);
        if (dbFiles && Object.keys(dbFiles).length > 0) {
          setFiles(dbFiles);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to load preview files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();

    // Listen for storage updates from the builder tab for instant live reload
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "kivo_preview_files" && e.newValue) {
        try {
          setFiles(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [projectId]);

  const previewHtml = useMemo(() => {
    if (!files) return "";
    return generatePreviewHtml(files);
  }, [files]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-neutral-400">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400 mr-2" />
        <span className="text-sm font-medium">Loading live preview...</span>
      </div>
    );
  }

  if (!files || Object.keys(files).length === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#09090b] text-neutral-400 gap-3">
        <p className="text-sm">No preview files found.</p>
        <button
          onClick={loadFiles}
          className="px-3 py-1.5 rounded-lg bg-neutral-800 text-xs text-white hover:bg-neutral-700 transition flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-black">
      <iframe
        srcDoc={previewHtml}
        title="Live Application Preview"
        className="w-full h-full border-none m-0 p-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
      />
    </div>
  );
}

export default function StandalonePreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-neutral-400">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400 mr-2" />
          <span className="text-sm font-medium">Loading live preview...</span>
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
