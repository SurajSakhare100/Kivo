"use client";

import React from "react";

export function Footer() {
  return (
    <footer className="w-full py-6 px-4 text-center mt-auto">
      <div className="max-w-3xl mx-auto space-y-1.5 text-xs text-[#737373]">
        <p className="leading-relaxed">
          By using Kivo App, you agree to our{" "}
          <a
            href="#terms"
            className="text-[#292929] hover:underline transition-all font-medium"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="#privacy"
            className="text-[#292929] hover:underline transition-all font-medium"
          >
            Privacy Policy
          </a>
          .
        </p>
        <p className="text-[11px] text-[#8E8E93] leading-relaxed">
          AI can make mistakes. Kivo App provides access to third-party LLMs via APIs. We are not affiliated with, endorsed by, or the owner of these models.
        </p>
      </div>
    </footer>
  );
}
