import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@forma/engine", "@forma/physics", "@forma/course-em1", "@forma/plate", "@forma/ui"],
  // Type checking runs via the workspace `pnpm typecheck` (TypeScript 7); Next's own pass is skipped.
  typescript: { ignoreBuildErrors: true },
  async redirects() {
    return [
      { source: "/c/:course/em1.electrostatics.flux-density", destination: "/c/:course/em1.electrostatics.gauss-law", permanent: true },
      { source: "/learn/em1.electrostatics.flux-density/:lesson", destination: "/learn/em1.electrostatics.gauss-law/flux-density", permanent: true },
    ];
  },
};

export default config;
