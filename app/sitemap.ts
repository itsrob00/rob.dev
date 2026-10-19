import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/projects";
import { sitemapUrls } from "@/lib/sitemap";

export const dynamic = "force-static";

// No lastModified: nothing in the content records when a page last changed.
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapUrls(getProjects()).map((url) => ({ url }));
}
