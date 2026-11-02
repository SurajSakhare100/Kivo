import type { NextConfig } from "next";

const webContainerIsolation = [
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Google Identity Services needs to open a popup and postMessage back.
        // Keep isolation off the marketing/login pages so Sign in with Google works.
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
      {
        source: "/builder",
        headers: webContainerIsolation,
      },
      {
        source: "/builder/:path*",
        headers: webContainerIsolation,
      },
      {
        source: "/preview",
        headers: webContainerIsolation,
      },
      {
        source: "/preview/:path*",
        headers: webContainerIsolation,
      },
      {
        source: "/project/:path*",
        headers: webContainerIsolation,
      },
    ];
  },
};

export default nextConfig;
