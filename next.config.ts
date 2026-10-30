import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the hosted preview / sandbox domain to load dev assets and HMR.
  allowedDevOrigins: ["*.e2b.app", "*.arena.ai", "*.vercel.app"],
};

export default nextConfig;
