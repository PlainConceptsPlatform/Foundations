import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import('next').NextConfig} */
const config = {
  // Node server build for Azure App Service. App Service Authentication
  // (Easy Auth / Entra ID) sits in front of the app to require login.
  output: "standalone",
  // Trace from the monorepo root so the standalone bundle is complete and the
  // server ends up at .next/standalone/apps/docs/server.js.
  outputFileTracingRoot: repoRoot,
  reactStrictMode: true,
};

export default withMDX(config);
