"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
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
        setError(res.error || "Google authentication failed.");
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
    const width = Math.max(240, Math.min(container.offsetWidth || 320, 360));
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

    setError("Google Sign-In is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in client/.env.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl text-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-xs shadow-sm">
              K
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
                Log in to Kivo
              </h3>
              <p className="text-[11px] text-neutral-500">
                Sign in with Google to continue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 break-words">{error}</div>
            </div>
          )}

          {isSubmitted ? (
            <div className="py-8 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 animate-in zoom-in-75">
                <Check className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-neutral-900">Signed In!</h4>
              <p className="text-xs text-neutral-500">
                Opening your workspace...
              </p>
            </div>
          ) : (
            <div className="py-2 space-y-3">
              {/* GIS container */}
              <div
                ref={googleBtnContainerRef}
                id="google-btn-container"
                className={`w-full min-h-[44px] flex justify-center ${isGsiRendered ? "" : "opacity-0 pointer-events-none absolute"}`}
              />

              {!isGsiRendered && (
                <button
                  type="button"
                  onClick={handleGoogleButtonClick}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 transition shadow-2xs active:scale-98 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-neutral-700" />
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-100 bg-neutral-50/50 text-center">
          <span className="text-[10px] text-neutral-400">
            By continuing, you agree to our Terms of Service &amp; Privacy Policy.
          </span>
        </div>
      </div>
    </div>
  );
}
