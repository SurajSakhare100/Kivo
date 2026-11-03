import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kivo — AI-Powered React App Builder",
  description:
    "Describe your app in plain English. Kivo generates production-ready React + TypeScript applications with live preview, code editor, and AI-powered iteration.",
  openGraph: {
    title: "Kivo — AI-Powered React App Builder",
    description:
      "Turn natural language into working React applications. Live preview, full code editor, and AI iteration — all in your browser.",
    type: "website",
    siteName: "Kivo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kivo — AI-Powered React App Builder",
    description:
      "Turn natural language into working React applications. Live preview, full code editor, and AI iteration.",
  },
};

import { AppProviders } from "@/components/AppProviders";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%2310b981'/><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-family='Arial' font-weight='900' font-size='20' fill='white'>K</text></svg>"
        />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="bg-white text-neutral-900 antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
