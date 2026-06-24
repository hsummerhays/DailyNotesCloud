import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained .next/standalone build with only the
  // node_modules actually needed at runtime, for a much smaller Docker image.
  output: "standalone",
};

export default nextConfig;
