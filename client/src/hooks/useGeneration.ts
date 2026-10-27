"use client";

import { useState, useCallback, useRef } from "react";
import { streamGenerateWebsite, GenerateRequest, StreamEvent } from "@/lib/api";

export type GenerationStatus =
  | "idle"
  | "planning"
  | "generating"
  | "reviewing"
  | "refining"
  | "validating"
  | "finalising"
  | "complete"
  | "error";

export interface GenerationStep {
  step: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
}

export interface GenerationState {
  status: GenerationStatus;
  steps: GenerationStep[];
  code: string;
  plan: string;
  projectId: string | null;
  error: string | null;
  tokensUsed: number;
  generationTime: number;
}

export const INITIAL_GENERATION_STATE: GenerationState = {
  status: "idle",
  steps: [
    { step: "plan", label: "Planning structure", status: "pending" },
    { step: "generate", label: "Generating code", status: "pending" },
    { step: "review", label: "Reviewing quality", status: "pending" },
    { step: "refine", label: "Refining result", status: "pending" },
    { step: "validate", label: "Safety checks", status: "pending" },
    { step: "finalise", label: "Finalising project", status: "pending" },
  ],
  code: "",
  plan: "",
  projectId: null,
  error: null,
  tokensUsed: 0,
  generationTime: 0,
};

export type GenerationResult =
  | { status: "complete" }
  | { status: "error"; error: string }
  | { status: "aborted" };

const STEP_TO_STATUS: Record<string, GenerationStatus> = {
  plan: "planning",
  generate: "generating",
  review: "reviewing",
  refine: "refining",
  validate: "validating",
  finalise: "finalising",
};

export function useGeneration() {
  const [state, setState] = useState<GenerationState>(INITIAL_GENERATION_STATE);

  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (req: GenerateRequest): Promise<GenerationResult> => {
    // Cancel any previous generation
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState({
      status: "planning",
      steps: INITIAL_GENERATION_STATE.steps,
      code: "",
      plan: "",
      projectId: null,
      error: null,
      tokensUsed: 0,
      generationTime: 0,
    });

    let result: GenerationResult | null = null;
    try {
      for await (const event of streamGenerateWebsite(req, abortRef.current.signal)) {
        if (event.event === "progress") {
          const currentStep = event.step;
          setState((prev) => ({
            ...prev,
            plan: event.plan || prev.plan,
            status: STEP_TO_STATUS[currentStep] || "generating",
            steps: prev.steps.map((s) => ({
              ...s,
              status:
                s.step === currentStep
                  ? "active"
                  : prev.steps.findIndex((x) => x.step === s.step) <
                    prev.steps.findIndex((x) => x.step === currentStep)
                  ? "done"
                  : "pending",
            })),
          }));
        } else if (event.event === "complete") {
          if (event.error) {
            const error = event.error || "Generation failed.";
            result = { status: "error", error };
            setState((prev) => ({
              ...prev,
              status: "error",
              error,
              steps: prev.steps.map((s) => ({ ...s, status: "error" })),
            }));
          } else {
            result = { status: "complete" };
            setState((prev) => ({
              ...prev,
              status: "complete",
              code: event.code || "",
              plan: event.plan || "",
              projectId: event.project_id || prev.projectId || null,
              tokensUsed: event.tokens_used || 0,
              generationTime: event.generation_time || 0,
              steps: prev.steps.map((s) => ({ ...s, status: "done" })),
            }));
          }
        } else if (event.event === "error") {
          result = { status: "error", error: event.error };
          setState((prev) => ({
            ...prev,
            status: "error",
            error: event.error,
            steps: prev.steps.map((step) =>
              step.status === "active" ? { ...step, status: "error" } : step,
            ),
          }));
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return { status: "aborted" };
      const error = err instanceof Error ? err.message : "Unknown error";
      result = { status: "error", error };
      setState((prev) => ({
        ...prev,
        status: "error",
        error,
        steps: prev.steps.map((step) =>
          step.status === "active" ? { ...step, status: "error" } : step,
        ),
      }));
    }

    if (result) return result;

    const error = "Generation stream ended without a result.";
    setState((prev) => ({
      ...prev,
      status: "error",
      error,
      steps: prev.steps.map((step) =>
        step.status === "active" ? { ...step, status: "error" } : step,
      ),
    }));
    return { status: "error", error };
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({
      ...prev,
      status: "idle",
      steps: prev.steps.map((step) =>
        step.status === "active" ? { ...step, status: "pending" } : step,
      ),
    }));
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_GENERATION_STATE);
  }, []);

  const restore = useCallback((savedState: GenerationState) => {
    abortRef.current?.abort();
    setState(savedState);
  }, []);

  return { state, generate, cancel, reset, restore };
}
