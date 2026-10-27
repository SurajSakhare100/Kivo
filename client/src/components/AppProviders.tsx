"use client";

import React from "react";
import Script from "next/script";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LoginModal } from "./LoginModal";
import { TokenSettingsModal } from "./TokenSettingsModal";

function GlobalModals() {
  const { isLoginModalOpen, closeLoginModal } = useAuth();
  return (
    <>
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
      <TokenSettingsModal />
    </>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* Google Identity Services SDK for Google Login */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />
      {children}
      <GlobalModals />
    </AuthProvider>
  );
}
