import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native / WASM packages stay outside the bundle and load from node_modules at runtime.
  serverExternalPackages: ["better-sqlite3", "wasmoon"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
