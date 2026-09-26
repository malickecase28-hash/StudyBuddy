import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@forma/engine", "@forma/physics", "@forma/course-em1", "@forma/plate", "@forma/ui"],
  // Type checking runs via the workspace `pnpm typecheck` (TypeScript 7); Next's own pass is skipped.
  typescript: { ignoreBuildErrors: true },
};

export default config;
