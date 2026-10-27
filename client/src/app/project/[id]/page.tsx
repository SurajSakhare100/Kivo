import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import BuilderWorkspace from "@/components/builder/BuilderWorkspace";

export const metadata: Metadata = {
  title: "Project — Kivo AI Builder",
  description: "Build React web applications with Kivo AI",
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-neutral-400">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        </div>
      }
    >
      <BuilderWorkspace initialProjectId={id} />
    </Suspense>
  );
}
