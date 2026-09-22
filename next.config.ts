import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // StrictMode's dev double-render rebuilds the entire (heavy) Three.js
  // scene graph twice synchronously, stalling the main thread long enough
  // for Chrome's GPU watchdog to kill the WebGL context — the dev-only
  // "scene freezes / goes static" bug. Production renders once and is
  // unaffected; we trade StrictMode's dev lint for a working dev preview.
  reactStrictMode: false,

  async redirects() {
    return [
      // /restaurants shipped briefly as a niche page beside a general-service
      // /pricing. The whole site is restaurants now, so the plans live at
      // /pricing and the old URL is retired permanently.
      { source: "/restaurants", destination: "/pricing", permanent: true },
      // The Free Growth Audit was the site-wide offer before the swap; every
      // CTA is a call now. Anything still linking to it lands on the plans.
      { source: "/audit", destination: "/pricing", permanent: true },
      // Growth Fuel marketing management came off with the swap.
      { source: "/marketing", destination: "/pricing", permanent: true },
    ];
  },
};

export default nextConfig;
