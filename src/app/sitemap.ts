import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1 },
    { path: "/audit", priority: 0.9 },
    { path: "/pricing", priority: 0.9 },
    { path: "/marketing", priority: 0.8 },
    { path: "/deskii", priority: 0.8 },
    { path: "/how-it-works", priority: 0.7 },
    { path: "/about", priority: 0.6 },
    { path: "/privacy", priority: 0.2 },
    { path: "/terms", priority: 0.2 },
  ];
  return routes.map((r) => ({
    url: `${SITE.url}${r.path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: r.priority,
  }));
}
