import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: Do NOT set `output: "standalone"` when deploying to Vercel.
  // Vercel handles the build output automatically. The standalone output
  // mode is for self-hosted Docker/server deployments and will cause
  // routing issues on Vercel.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
