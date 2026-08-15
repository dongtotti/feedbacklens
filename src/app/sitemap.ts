import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://feedbacklens.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/upload", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/history", priority: 0.6, changeFrequency: "daily" as const },
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
