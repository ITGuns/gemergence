import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // StrictMode's dev double-render rebuilds the entire (heavy) Three.js
  // scene graph twice synchronously, stalling the main thread long enough
  // for Chrome's GPU watchdog to kill the WebGL context — the dev-only
  // "scene freezes / goes static" bug. Production renders once and is
  // unaffected; we trade StrictMode's dev lint for a working dev preview.
  reactStrictMode: false,
};

export default nextConfig;
