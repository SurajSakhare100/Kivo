"use client";

import React, { useState } from "react";
import { X, Check, RotateCcw, Shield, Zap, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function TokenSettingsModal() {
  const {
    tokens,
    user,
    isTokenSettingsOpen,
    closeTokenSettings,
    updateDummySettings,
    refillTokens,
  } = useAuth();

  const [isUpdating, setIsUpdating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isTokenSettingsOpen) return null;

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2500);
  };

  const handleReset = async () => {
    setIsUpdating(true);
    await updateDummySettings({ resetUsage: true });
    setIsUpdating(false);
    showNotice("Usage reset successfully");
  };

  const handleRefill = async () => {
    setIsUpdating(true);
    await refillTokens(50000);
    setIsUpdating(false);
    showNotice("+50,000 allowance added");
  };

  const currentRemaining = tokens?.tokensRemaining ?? 50000;
  const currentTotal = tokens?.tokenLimit ?? 50000;
  const percentUsed = Math.min(100, tokens?.percentUsed ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl text-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              K
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Workspace Settings</h3>
              <p className="text-[11px] text-neutral-500">Manage plan &amp; generation allowance</p>
            </div>
          </div>
          <button
            onClick={closeTokenSettings}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notice feedback banner */}
        {notice && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2 text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
            <Check className="h-3.5 w-3.5" />
            <span>{notice}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* User Profile Card */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 bg-neutral-50/60">
            <div className="h-10 w-10 rounded-full bg-fuchsia-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900 truncate">
                {user?.name || "Active Workspace"}
              </p>
              <p className="text-xs text-neutral-500 truncate">{user?.email || "Signed in with Google"}</p>
            </div>
            <span className="text-[11px] font-bold text-neutral-600 bg-white border border-neutral-200 px-2 py-0.5 rounded-full shadow-2xs">
              Free Plan
            </span>
          </div>

          {/* Usage Meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-neutral-600">Generation Allowance</span>
              <span className="text-neutral-900 font-semibold tabular-nums">
                {currentRemaining.toLocaleString()} / {currentTotal.toLocaleString()}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(4, 100 - percentUsed)}%` }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleRefill}
              disabled={isUpdating}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition active:scale-98 disabled:opacity-60 cursor-pointer shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Refill Allowance</span>
            </button>
            <button
              onClick={handleReset}
              disabled={isUpdating}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition active:scale-98 disabled:opacity-60 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Usage</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-end">
          <button
            onClick={closeTokenSettings}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-200/60 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
