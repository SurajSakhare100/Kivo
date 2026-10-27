import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kivo — AI React App Builder",
  description:
    "Build full-stack React and TypeScript applications in your browser with AI, live hot-reloading preview, and Monaco code editor.",
  openGraph: {
    title: "Kivo AI — React App Builder",
    description: "Describe your app and watch it come to life in a live preview.",
    type: "website",
  },
};

import { AppProviders } from "@/components/AppProviders";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%2310b981'/><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-family='Arial' font-weight='900' font-size='20' fill='black'>K</text></svg>"
        />
      </head>
      <body className="bg-[#050505] text-neutral-100 antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
