import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "kivo.ai",
  description: "Minimalist, powerful AI assistant with support for multi-model reasoning.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.cdnfonts.com/css/google-sans"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white text-[#292929] antialiased selection:bg-[#292929] selection:text-white flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
