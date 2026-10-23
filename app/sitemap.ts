import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/projects";
import { sitemapEntries } from "@/lib/sitemap";

export const dynamic = "force-static";

// No lastModified: nothing in the content records when a page last changed.
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(getProjects());
}
