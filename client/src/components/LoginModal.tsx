"use client";

import React, { useState } from "react";
import { Modal, Button } from "@heroui/react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <Modal.Root isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <Modal.Container className="w-full max-w-md  overflow-hidden p-0">
          <Modal.Dialog>
            {/* Header */}
            <Modal.Header className="flex items-center justify-between px-6 py-4 border-b border-[#F6F6F7]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center text-[#292929]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                  </svg>
                </div>
                <Modal.Heading className="text-base font-semibold text-[#292929]">
                  Sign in to chatbotapp.ai
                </Modal.Heading>
              </div>
              <Modal.CloseTrigger
                onClick={onClose}
                className="p-1 rounded-lg text-[#737373] hover:text-[#292929] hover:bg-[#F6F6F7] cursor-pointer transition-colors"
                aria-label="Close modal"
              >
                ✕
              </Modal.CloseTrigger>
            </Modal.Header>

            {/* Content */}
            <Modal.Body className="p-6">
              {isSubmitted ? (
                <div className="py-6 text-center text-sm text-green-600 font-medium">
                  ✓ Magic link sent to {email}!
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#292929] mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#292929] placeholder:text-[#9CA3AF] focus:outline-hidden focus:border-[#292929] transition-colors"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#292929] hover:bg-[#1a1a1a] text-white font-medium py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Continue with Email
                  </Button>

                  <div className="relative flex items-center justify-center my-3">
                    <span className="w-full border-t border-[#E5E7EB]"></span>
                    <span className="absolute bg-white px-3 text-[11px] text-[#737373] uppercase tracking-wider">
                      or
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(true);
                      setTimeout(onClose, 800);
                    }}
                    className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] hover:bg-[#F6F6F7] text-sm font-medium text-[#292929] transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                    Continue with Google
                  </button>
                </form>
              )}
            </Modal.Body>

            {/* Footer */}
            <Modal.Footer className="px-6 py-3 border-t border-[#F6F6F7] bg-[#F6F6F7]/40 text-center justify-center">
              <span className="text-[11px] text-[#8E8E93]">
                By signing in you agree to our Terms and Privacy Policy.
              </span>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
