"use client";

import React, { useState } from "react";
import { Zap, Sliders, LogOut, ChevronDown, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onLoginClick?: () => void;
  onResetChat?: () => void;
}

export function Navbar({ onLoginClick, onResetChat }: NavbarProps) {
  const {
    user,
    tokens,
    isAuthenticated,
    openLoginModal,
    openTokenSettings,
    logout,
  } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogin = () => {
    if (onLoginClick) onLoginClick();
    else openLoginModal();
  };

  const tokensRemaining = tokens?.tokensRemaining ?? 50000;
  const percentUsed = tokens?.percentUsed ?? 0;
  const currentPlan = tokens?.plan ?? "free";

  return (
    <header className="w-full flex items-center justify-between px-6 py-3.5 md:px-8 bg-[#09090b]/90 backdrop-blur-md border-b border-neutral-800 text-white z-20">
      {/* Brand Logo & Name */}
      <button
        onClick={onResetChat}
        className="flex items-center gap-2.5 text-white hover:opacity-85 transition-opacity cursor-pointer group"
        aria-label="kivo.ai home"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black font-bold text-xs shadow-md shadow-emerald-500/20 group-hover:rotate-6 transition-transform">
          K
        </div>
        <span className="font-semibold text-[17px] tracking-tight text-white">
          kivo<span className="text-emerald-400">.ai</span>
        </span>
      </button>

      {/* Right Actions: Token Counter & User Auth */}
      <div className="flex items-center gap-3">
        {/* Token Pill Button */}
        <button
          onClick={openTokenSettings}
          title="Click to view token budget and dummy limits"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800/80 hover:border-neutral-700 text-xs transition cursor-pointer shadow-xs group"
        >
          <Zap
            className={`h-3.5 w-3.5 ${
              percentUsed > 80
                ? "text-red-400"
                : percentUsed > 50
                ? "text-amber-400"
                : "text-emerald-400"
            } group-hover:scale-110 transition-transform`}
          />
          <span className="font-medium text-neutral-300">
            {tokensRemaining.toLocaleString()} <span className="text-neutral-500 text-[10px]">tokens</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700/60">
            {currentPlan}
          </span>
        </button>

        {isAuthenticated && user ? (
          /* User Profile & Menu */
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 pl-2 rounded-full border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 transition cursor-pointer text-xs"
            >
              <img
                src={user.picture}
                alt={user.name}
                className="w-6 h-6 rounded-full border border-neutral-700 object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="font-medium text-neutral-200 max-w-[100px] truncate hidden sm:inline">
                {user.name.split(" ")[0]}
              </span>
              <ChevronDown className="h-3 w-3 text-neutral-400 mr-1" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-neutral-800 bg-[#0d0d0f] shadow-2xl p-2 z-40 text-xs animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-neutral-800 mb-1">
                    <p className="font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                        {currentPlan} Plan
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openTokenSettings();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition cursor-pointer text-left"
                  >
                    <Sliders className="h-3.5 w-3.5 text-amber-400" />
                    Token Settings & Limits
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer text-left mt-1"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Login Trigger */
          <button
            onClick={handleLogin}
            className="bg-white hover:bg-neutral-200 text-black text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Log in
          </button>
        )}
      </div>
    </header>
  );
}
