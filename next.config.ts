import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

// Serwist doesn't support Turbopack in dev (we disable it there anyway).
process.env.SERWIST_SUPPRESS_TURBOPACK_WARNING = "1";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  // Pin the workspace root so Next doesn't pick the wrong parent lockfile.
  turbopack: {
    root: process.cwd(),
  },
};

export default withSerwist(nextConfig);
