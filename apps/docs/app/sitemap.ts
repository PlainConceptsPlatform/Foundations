import { siteUrl } from "@/lib/site";
import { source } from "@/lib/source";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = source.getPages().map((page) => ({
    url: new URL(page.url, siteUrl).toString(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: new URL("/", siteUrl).toString(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    ...pages,
  ];
}
