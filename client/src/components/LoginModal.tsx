"use client";

import React, { useState, useEffect } from "react";
import { Zap, ShieldCheck, Sparkles, Check, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { loginWithGoogle, loginDemo, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Identity Services (GIS) if Client ID exists
  useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!isOpen || !googleClientId) return;

    const handleCredentialResponse = async (response: any) => {
      if (response.credential) {
        const success = await loginWithGoogle(response.credential);
        if (success) onClose();
      }
    };

    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById("google-btn-container"),
          { theme: "outline", size: "large", width: "100%", text: "continue_with" }
        );
      } catch (err) {
        console.warn("Failed to render Google button:", err);
      }
    }
  }, [isOpen, loginWithGoogle, onClose]);

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    setError(null);
    try {
      // If GIS client library is loaded and client id is configured, trigger prompt
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (googleClientId && typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.prompt();
      } else {
        // Dev / Demonstration Google Sign-In with instant verified session
        const success = await loginDemo(
          email.trim() || "google.builder@gmail.com",
          name.trim() || "Google Builder"
        );
        if (success) {
          setIsSubmitted(true);
          setTimeout(() => {
            setIsSubmitted(false);
            onClose();
          }, 800);
        } else {
          setError("Google sign-in could not be completed. Please check server.");
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);

    const success = await loginDemo(email, email.split("@")[0]);
    if (success) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 900);
    } else {
      setError("Failed to sign in. Please ensure the Express server is running.");
    }
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
                Unlock 50,000 monthly tokens & persistent projects
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
            <Zap className="h-3.5 w-3.5" /> 50,000 Free Tokens
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" /> Redis Rate Limiter
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5" /> Fast Inference
          </span>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {isSubmitted ? (
            <div className="py-8 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-in zoom-in-75">
                <Check className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-white">Signed In Successfully!</h4>
              <p className="text-xs text-neutral-400">
                Loaded your token allowance and workspace session.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* GIS Container if configured */}
              <div id="google-btn-container" className="empty:hidden mb-2" />

              {/* Primary Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-sm font-medium text-white transition-all cursor-pointer shadow-sm active:scale-98"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <span className="w-full border-t border-neutral-800" />
                <span className="absolute bg-[#0d0d0f] px-3 text-[10px] text-neutral-500 uppercase tracking-wider">
                  or sign in with email
                </span>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900/60 text-sm text-white placeholder:text-neutral-600 focus:outline-hidden focus:border-neutral-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-neutral-200 text-black text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  {isLoading ? "Signing in..." : "Continue with Email"}
                </button>
              </form>

              {/* Fast 1-Click Demo Login */}
              <div className="pt-2 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => handleGoogleClick()}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-900/40 hover:bg-neutral-900 text-[11px] text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    Instant Demo Mode (1-Click Test Sign-In)
                  </span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800/80 bg-neutral-950/60 text-center">
          <span className="text-[10px] text-neutral-500">
            By signing in you agree to our Terms of Service & Privacy Policy.
          </span>
        </div>
      </div>
    </div>
  );
}
