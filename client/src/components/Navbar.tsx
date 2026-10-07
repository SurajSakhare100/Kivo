"use client";

import React from "react";
import { Button } from "@heroui/react";

interface NavbarProps {
  onLoginClick: () => void;
  onResetChat?: () => void;
}

export function Navbar({ onLoginClick, onResetChat }: NavbarProps) {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 md:px-10 md:py-6 bg-white z-20">
      {/* Brand Logo & Name */}
      <button
        onClick={onResetChat}
        className="flex items-center gap-2.5 text-[#292929] hover:opacity-80 transition-opacity cursor-pointer group"
        aria-label="kivo.ai home"
      >
        {/* Brand Icon (8-point rounded star / spark) */}
        <div className="w-5 h-5 relative flex items-center justify-center text-[#292929]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45"
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
        <span className="font-semibold text-[17px] tracking-tight text-[#292929]">
          kivo.ai
        </span>
      </button>

      {/* Right Action: Log In Button */}
      <div className="flex items-center gap-3">
        <Button
          onPress={onLoginClick}
          className="bg-[#292929] hover:bg-[#1f1f1f] text-white text-sm font-medium px-4 py-1.5 h-9 rounded-xl transition-all shadow-sm active:scale-95"
        >
          Log in
        </Button>
      </div>
    </header>
  );
}
