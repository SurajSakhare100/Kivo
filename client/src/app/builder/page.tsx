import type { Metadata } from "next";
import { Suspense } from "react";
import BuilderWorkspace from "@/components/builder/BuilderWorkspace";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Builder — Kivo AI",
  description: "Build React web applications with AI in seconds",
};

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-neutral-400">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        </div>
      }
    >
      <BuilderWorkspace />
    </Suspense>
  );
}
