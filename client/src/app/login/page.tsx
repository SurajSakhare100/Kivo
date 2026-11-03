"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, Loader2, AlertCircle, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    auto_select?: boolean;
    ux_mode?: "popup" | "redirect";
    use_fedcm_for_prompt?: boolean;
    cancel_on_tap_outside?: boolean;
    itp_support?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: string;
      theme?: string;
      size?: string;
      text?: string;
      shape?: string;
      logo_alignment?: string;
      width?: number;
    }
  ) => void;
  prompt: (callback?: (notification: {
    isNotDisplayed: () => boolean;
    isSkippedMoment: () => boolean;
    getNotDisplayedReason: () => string;
    getSkippedReason: () => string;
  }) => void) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

function getGoogleAccountsId(): GoogleAccountsId | null {
  if (typeof window === "undefined") return null;
  return window.google?.accounts?.id ?? null;
}

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isGsiRendered, setIsGsiRendered] = useState(false);
  const [promptValue, setPromptValue] = useState("Ask Kivo to build your SaaS startup...");
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").replace(/['"]/g, "").trim();
  const isConfigured = Boolean(
    googleClientId &&
    googleClientId !== "your_google_client_id_here" &&
    googleClientId !== "your_google_client_id"
  );

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleCredentialResponse = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) {
        setError("No credential returned by Google. Please try again.");
        return;
      }
      setError(null);
      const res = await loginWithGoogle(response.credential);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 600);
      } else {
        setError(res.error || "Google authentication failed.");
      }
    },
    [loginWithGoogle, router]
  );

  const renderGoogleButton = useCallback(() => {
    const googleId = getGoogleAccountsId();
    const container = googleBtnRef.current;
    if (!isConfigured || !googleId || !container) return false;

    googleId.initialize({
      client_id: googleClientId,
      callback: handleCredentialResponse,
      auto_select: false,
      ux_mode: "popup",
      use_fedcm_for_prompt: true,
      cancel_on_tap_outside: true,
      itp_support: true,
    });

    container.innerHTML = "";
    const width = Math.max(260, Math.min(container.offsetWidth || 340, 360));
    googleId.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width,
    });
    setIsGsiRendered(true);
    return true;
  }, [googleClientId, handleCredentialResponse, isConfigured]);

  useEffect(() => {
    if (!isConfigured) return;

    let cancelled = false;
    let checkCount = 0;
    const maxChecks = 40;

    const tryRender = () => {
      if (cancelled) return true;
      try {
        return renderGoogleButton();
      } catch (err) {
        console.warn("[GSI] Could not render button:", err);
        return false;
      }
    };

    if (tryRender()) return;

    const interval = setInterval(() => {
      checkCount++;
      if (tryRender() || checkCount >= maxChecks) {
        clearInterval(interval);
        if (checkCount >= maxChecks && !getGoogleAccountsId()) {
          setError("Google Sign-In failed to load. Check your network connection.");
        }
      }
    }, 150);

    const onGsiLoaded = () => { tryRender(); };
    window.addEventListener("gsi-loaded", onGsiLoaded);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("gsi-loaded", onGsiLoaded);
    };
  }, [isConfigured, renderGoogleButton]);

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to dashboard with pre-filled prompt
    if (promptValue.trim()) {
      router.push(`/dashboard?prompt=${encodeURIComponent(promptValue.trim())}`);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#121214] text-white">
      {/* ─────────────────────────────────────────────────────────
          LEFT COLUMN: AUTH (Matches 2nd Image)
          ───────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[480px] xl:w-[520px] bg-[#121214] flex flex-col justify-between p-8 sm:p-12 z-10 shrink-0">
        <div>
          {/* Brand Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-16 group">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-extrabold text-base tracking-tight">K</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Kivo</span>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
              Log in
            </h1>
            <p className="text-sm text-neutral-400">
              Welcome to Kivo. Sign in or sign up with Google to continue.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 break-words leading-relaxed">{error}</div>
            </div>
          )}

          {isSuccess ? (
            <div className="py-12 text-center space-y-3 rounded-2xl bg-white/5 border border-white/10 p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Signed In Successfully</h3>
              <p className="text-xs text-neutral-400">Opening your workspace...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Google Button Container for GIS */}
              <div
                ref={googleBtnRef}
                id="google-login-page-btn"
                className={`w-full min-h-[46px] flex justify-center ${isGsiRendered ? "" : "opacity-0 pointer-events-none absolute"}`}
              />

              {!isGsiRendered && (
                <button
                  type="button"
                  onClick={() => {
                    const googleId = getGoogleAccountsId();
                    if (isConfigured && googleId) {
                      googleId.prompt();
                    } else {
                      setError("Google Sign-In is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to client/.env");
                    }
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3.5 px-5 py-3.5 rounded-full border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-sm font-medium text-white transition-all shadow-sm active:scale-98 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>
              )}

              <p className="text-[11px] text-neutral-500 text-center pt-2">
                Login and sign up are unified through Google authentication.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-neutral-800 text-center sm:text-left">
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            By signing in you agree to our{" "}
            <Link href="/" className="text-neutral-400 hover:text-white underline">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/" className="text-neutral-400 hover:text-white underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          RIGHT COLUMN: ATMOSPHERIC GRADIENT & FLOATING PROMPT CARD
          ───────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden bg-radial-[at_50%_40%] from-[#2a1b4e] via-[#0d1430] to-[#090b12]">
        {/* Soft atmospheric glowing orbs */}
        <div className="absolute top-1/4 -right-10 w-96 h-96 rounded-full bg-pink-500/20 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 -left-10 w-96 h-96 rounded-full bg-blue-600/20 blur-[130px] pointer-events-none" />

        {/* Center Floating Prompt Mockup Card */}
        <div className="relative z-10 w-full max-w-lg px-6">
          <form
            onSubmit={handlePromptSubmit}
            className="group flex items-center justify-between rounded-full bg-white/95 text-neutral-900 px-6 py-4 shadow-2xl backdrop-blur-md border border-white/40 hover:bg-white transition-all"
          >
            <input
              type="text"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder="Ask Kivo to build your SaaS startup..."
              className="bg-transparent text-sm font-medium text-neutral-900 placeholder-neutral-500 outline-none w-full pr-4"
            />
            <button
              type="submit"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-800 transition active:scale-95 cursor-pointer shadow-md"
              title="Start building"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>

          <p className="text-center text-xs text-neutral-400 mt-4 tracking-wide">
            Turn natural language ideas into full-stack web applications.
          </p>
        </div>
      </div>
    </div>
  );
}

