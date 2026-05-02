import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

/** Wraps the Next.js config with Serwist service worker compilation. */
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSerwist(nextConfig);
