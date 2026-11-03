"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/* ─────────────────────────────────────────────────────────
   NAVIGATION (Crisp Light Mode, Constant Margins)
   ───────────────────────────────────────────────────────── */
export function Navigation() {
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-neutral-200/80 shadow-xs"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-6 sm:px-10 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Kivo home">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-[11px] font-bold text-white shadow-xs transition-transform group-hover:scale-105">
            K
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-neutral-900">kivo</span>
        </Link>

        {/* Center nav links — desktop */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-[13px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-[13px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            How it works
          </a>
          <a
            href="#showcase"
            className="text-[13px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Showcase
          </a>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 p-1 pr-2.5 text-xs hover:border-neutral-300 transition cursor-pointer"
            >
              <img
                src={user.picture}
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="text-neutral-700 font-medium hidden sm:inline">
                {user.name.split(" ")[0]}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-[13px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer px-2"
            >
              Log in
            </Link>
          )}

          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-neutral-900 px-4 text-[13px] font-medium text-white transition hover:bg-neutral-800 shadow-xs"
          >
            Start building
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer"
            aria-label="Toggle menu"
          >
            <span
              className={`block h-0.5 w-5 bg-neutral-700 transition-transform ${
                mobileOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-neutral-700 transition-opacity ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-neutral-700 transition-transform ${
                mobileOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200/80 bg-white/95 backdrop-blur-xl px-6 pb-6 pt-4 space-y-4 shadow-lg">
          <a
            href="#features"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            How it works
          </a>
          <a
            href="#showcase"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            Showcase
          </a>
          {!isAuthenticated && (
            <button
              onClick={() => {
                openLoginModal();
                setMobileOpen(false);
              }}
              className="block text-sm font-medium text-neutral-600 cursor-pointer"
            >
              Sign in
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

