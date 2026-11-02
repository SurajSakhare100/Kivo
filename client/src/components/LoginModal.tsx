"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Zap, ShieldCheck, Sparkles, Check, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { loginWithGoogle, isLoading } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGsiRendered, setIsGsiRendered] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").replace(/['"]/g, "").trim();
  const isConfigured = Boolean(
    googleClientId &&
    googleClientId !== "your_google_client_id_here" &&
    googleClientId !== "your_google_client_id"
  );

  const handleCredentialResponse = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) {
        setError("No credential returned by Google. Please try again.");
        return;
      }
      setError(null);
      const res = await loginWithGoogle(response.credential);
      if (res.success) {
        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          onClose();
        }, 700);
      } else {
        setError(res.error || "Google authentication failed. Please check server settings.");
      }
    },
    [loginWithGoogle, onClose]
  );

  const renderGoogleButton = useCallback(() => {
    const googleId = getGoogleAccountsId();
    const container = googleBtnContainerRef.current;
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
    const width = Math.max(240, Math.min(container.offsetWidth || 360, 400));
    googleId.renderButton(container, {
      type: "standard",
      theme: "filled_black",
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
    if (!isOpen) {
      setIsGsiRendered(false);
      setError(null);
      return;
    }

    if (!isConfigured) return;

    let cancelled = false;
    let checkCount = 0;
    const maxChecks = 40;

    const tryRender = () => {
      if (cancelled) return true;
      try {
        return renderGoogleButton();
      } catch (err: unknown) {
        console.warn("[GSI] Could not render Google button:", err);
        return false;
      }
    };

    if (tryRender()) return;

    const interval = setInterval(() => {
      checkCount++;
      if (tryRender() || checkCount >= maxChecks) {
        clearInterval(interval);
        if (checkCount >= maxChecks && !getGoogleAccountsId()) {
          setError("Google Sign-In failed to load. Check your connection and try again.");
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
  }, [isOpen, isConfigured, renderGoogleButton]);

  if (!isOpen) return null;

  const handleGoogleButtonClick = async () => {
    setError(null);
    const googleId = getGoogleAccountsId();

    if (isConfigured && googleId) {
      if (!isGsiRendered) renderGoogleButton();
      googleId.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          setError(`Google Sign-In unavailable: ${notification.getNotDisplayedReason()}`);
        }
      });
      return;
    }

    // No client ID configured — show a clear error instead of silently falling back
    setError(
      "Google Sign-In is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in client/.env and GOOGLE_CLIENT_ID in server/.env, then restart both servers."
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-[#0d0d0f] shadow-2xl text-neutral-100">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black font-bold text-xs shadow-md shadow-emerald-500/20">
              K
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-white">
                Sign in to Kivo AI Builder
              </h3>
              <p className="text-[11px] text-neutral-400">
                Unlock 50,000 monthly tokens &amp; persistent projects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Benefits strip */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border-b border-neutral-800 px-6 py-2.5 flex items-center justify-between text-[11px] text-emerald-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Zap className="h-3.5 w-3.5" /> 50k Free Tokens
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" /> Rate Limited
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5" /> Fast Inference
          </span>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 break-words">{error}</div>
            </div>
          )}

          {isSubmitted ? (
            <div className="py-10 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-75">
                <Check className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-white">Signed In Successfully!</h4>
              <p className="text-xs text-neutral-400">
                Your token allowance and workspace session are ready.
              </p>
            </div>
          ) : (
            <div className="py-2">
              {/* GIS renders the real button here; kept visible so GIS can measure width */}
              <div
                ref={googleBtnContainerRef}
                id="google-btn-container"
                className={`w-full min-h-[44px] flex justify-center ${isGsiRendered ? "" : "opacity-0 pointer-events-none absolute"}`}
              />

              {/* Fallback / loading button shown until GIS iframe renders */}
              {!isGsiRendered && (
                <button
                  type="button"
                  onClick={handleGoogleButtonClick}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-sm font-medium text-white transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>
              )}

              {!isConfigured && (
                <p className="mt-3 text-[10px] text-neutral-500 text-center leading-relaxed">
                  Set <code className="text-neutral-400 bg-neutral-800 px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in{" "}
                  <code className="text-neutral-400 bg-neutral-800 px-1 py-0.5 rounded">client/.env</code> to enable Google Sign-In.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800/80 bg-neutral-950/60 text-center">
          <span className="text-[10px] text-neutral-500">
            By signing in you agree to our Terms of Service &amp; Privacy Policy.
          </span>
        </div>
      </div>
    </div>
  );
}
